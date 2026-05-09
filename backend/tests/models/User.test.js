const { User, parseUserRole } = require('../../models/User');

describe('User Model', () => {
    it('should parse valid user roles correctly', () => {
        expect(parseUserRole('admin')).toBe('admin');
        expect(parseUserRole('manager')).toBe('manager');
        expect(parseUserRole('Technicien')).toBe('technician');
    });

    it('should default to operator for invalid roles', () => {
        expect(parseUserRole('invalid_role')).toBe('operator');
        expect(parseUserRole('')).toBe('operator');
        expect(parseUserRole(null)).toBe('operator');
    });

    it('should create a User object from JSON', () => {
        const jsonData = {
            id: '123',
            email: 'test@icem.app',
            fullName: 'Test User',
            role: 'manager'
        };

        const user = User.fromJson(jsonData);
        
        expect(user.id).toBe('123');
        expect(user.email).toBe('test@icem.app');
        expect(user.roles).toContain('manager');
        expect(user.isActive).toBe(true);
    });

    it('should serialize User to JSON correctly', () => {
        const user = new User({
            id: '456',
            email: 'admin@icem.app',
            fullName: 'Admin User',
            roles: ['admin']
        });

        const json = user.toJson();
        expect(json.id).toBe('456');
        expect(json.role).toBe('admin');
    });
});
