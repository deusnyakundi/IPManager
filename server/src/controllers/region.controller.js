const pool = require('../config/db');

exports.getRegions = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM regions');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createRegion = async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query('INSERT INTO regions (name) VALUES ($1) RETURNING *', [name]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteRegion = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM regions WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};