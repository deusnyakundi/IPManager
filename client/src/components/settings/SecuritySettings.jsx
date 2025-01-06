import React from 'react';
import TwoFactorConfig from '../auth/TwoFactorConfig';

const SecuritySettings = ({ user }) => {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-8">Security Settings</h1>
            
            <div className="space-y-8">
                {/* 2FA Configuration Section */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication</h2>
                    <TwoFactorConfig userId={user.id} />
                </div>

                {/* Add other security settings sections here */}
            </div>
        </div>
    );
};

export default SecuritySettings; 