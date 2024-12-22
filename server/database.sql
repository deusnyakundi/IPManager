-- Create database
CREATE DATABASE ip_management;

-- Connect to the database
\c ip_management;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Create sequences
CREATE SEQUENCE ip_assignments_id_seq;
CREATE SEQUENCE ip_blocks_id_seq;
CREATE SEQUENCE ip_ranges_id_seq;
CREATE SEQUENCE regions_id_seq;
CREATE SEQUENCE sites_id_seq;
CREATE SEQUENCE users_id_seq;
CREATE SEQUENCE vcid_ranges_id_seq;
CREATE SEQUENCE vlan_ranges_id_seq;
CREATE SEQUENCE vlans_id_seq;

-- Create regions table (created first as it's referenced by other tables)
CREATE TABLE regions (
    id integer NOT NULL DEFAULT nextval('regions_id_seq'::regclass),
    name character varying(50) NOT NULL,
    CONSTRAINT regions_pkey PRIMARY KEY (id),
    CONSTRAINT regions_name_key UNIQUE (name)
);

-- Create users table
CREATE TABLE users (
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    role user_role DEFAULT 'user'::user_role,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    refresh_token text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_username_key UNIQUE (username)
);

-- Create ip_assignments table
CREATE TABLE ip_assignments (
    id integer NOT NULL DEFAULT nextval('ip_assignments_id_seq'::regclass),
    site_name character varying(100) NOT NULL,
    region_id integer,
    assigned_ip inet NOT NULL,
    management_vlan integer NOT NULL,
    primary_vcid integer NOT NULL,
    secondary_vcid integer NOT NULL,
    vsi_id integer NOT NULL,
    assigned_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ip_assignments_pkey PRIMARY KEY (id),
    CONSTRAINT ip_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES users(id),
    CONSTRAINT ip_assignments_region_id_fkey FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- Create ip_blocks table
CREATE TABLE ip_blocks (
    id integer NOT NULL DEFAULT nextval('ip_blocks_id_seq'::regclass),
    block character varying(255) NOT NULL,
    region_id integer,
    CONSTRAINT ip_blocks_pkey PRIMARY KEY (id),
    CONSTRAINT ip_blocks_region_id_fkey FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- Create ip_ranges table
CREATE TABLE ip_ranges (
    id integer NOT NULL DEFAULT nextval('ip_ranges_id_seq'::regclass),
    region_id integer,
    start_ip inet NOT NULL,
    end_ip inet NOT NULL,
    is_active boolean DEFAULT true,
    CONSTRAINT ip_ranges_pkey PRIMARY KEY (id),
    CONSTRAINT ip_ranges_region_id_fkey FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- Create sites table
CREATE TABLE sites (
    id integer NOT NULL DEFAULT nextval('sites_id_seq'::regclass),
    name character varying(255) NOT NULL,
    ip character varying(15) NOT NULL,
    region_id integer,
    vlan integer,
    CONSTRAINT sites_pkey PRIMARY KEY (id),
    CONSTRAINT sites_region_id_fkey FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- Create vcid_ranges table
CREATE TABLE vcid_ranges (
    id integer NOT NULL DEFAULT nextval('vcid_ranges_id_seq'::regclass),
    region_id integer,
    start_primary_vcid integer NOT NULL,
    end_primary_vcid integer NOT NULL,
    start_secondary_vcid integer NOT NULL,
    end_secondary_vcid integer NOT NULL,
    start_vsi_id integer NOT NULL,
    end_vsi_id integer NOT NULL,
    CONSTRAINT vcid_ranges_pkey PRIMARY KEY (id),
    CONSTRAINT vcid_ranges_region_id_fkey FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- Create vlan_ranges table
CREATE TABLE vlan_ranges (
    id integer NOT NULL DEFAULT nextval('vlan_ranges_id_seq'::regclass),
    start_vlan integer NOT NULL,
    end_vlan integer NOT NULL,
    region_id integer NOT NULL,
    CONSTRAINT vlan_ranges_pkey PRIMARY KEY (id),
    CONSTRAINT vlan_ranges_region_id_fkey FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- Create vlans table
CREATE TABLE vlans (
    id integer NOT NULL DEFAULT nextval('vlans_id_seq'::regclass),
    vlan integer NOT NULL,
    region_id integer,
    is_assigned boolean DEFAULT false,
    CONSTRAINT vlans_pkey PRIMARY KEY (id),
    CONSTRAINT vlans_vlan_key UNIQUE (vlan),
    CONSTRAINT vlans_region_id_fkey FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- Grant sequence ownership
ALTER SEQUENCE ip_assignments_id_seq OWNED BY ip_assignments.id;
ALTER SEQUENCE ip_blocks_id_seq OWNED BY ip_blocks.id;
ALTER SEQUENCE ip_ranges_id_seq OWNED BY ip_ranges.id;
ALTER SEQUENCE regions_id_seq OWNED BY regions.id;
ALTER SEQUENCE sites_id_seq OWNED BY sites.id;
ALTER SEQUENCE users_id_seq OWNED BY users.id;
ALTER SEQUENCE vcid_ranges_id_seq OWNED BY vcid_ranges.id;
ALTER SEQUENCE vlan_ranges_id_seq OWNED BY vlan_ranges.id;
ALTER SEQUENCE vlans_id_seq OWNED BY vlans.id;

-- Create default admin user
-- Password is 'admin123' (hashed with bcrypt)
INSERT INTO users (username, password, role) 
VALUES (
    'admin',
    '$2a$10$Aq6GLKWffkal6x0/HjlUTeND6ag9Lv2O0iMnLWwsXu5UIi2BD/fmm',
    'admin'
) ON CONFLICT (username) DO NOTHING;