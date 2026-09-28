import { RoleService } from './role.service';

describe('RoleService', () => {
  let service: RoleService;

  beforeEach(() => {
    service = new RoleService();
  });

  describe('claimCommand', () => {
    it('should allow claiming Command when no one holds it', () => {
      const result = service.claimCommand('socket-1');
      expect(result).toEqual({ success: true });
      expect(service.getRoleState().commandHolder).toBe('socket-1');
    });

    it('should reject claiming Command when already taken', () => {
      service.claimCommand('socket-1');
      const result = service.claimCommand('socket-2');
      expect(result.success).toBe(false);
      expect(result.error).toContain('already taken');
    });

    it('should reject if the socket already holds a role', () => {
      service.claimCommand('socket-1');
      const result = service.claimCommand('socket-1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('already hold a role');
    });
  });

  describe('claimCaptain', () => {
    it('should allow claiming Captain for an available ship', () => {
      const result = service.claimCaptain('socket-1', 'MV-1');
      expect(result).toEqual({ success: true });
      expect(service.getRoleState().captainedShips['MV-1']).toBe('socket-1');
    });

    it('should reject claiming Captain for a ship that already has one', () => {
      service.claimCaptain('socket-1', 'MV-1');
      const result = service.claimCaptain('socket-2', 'MV-1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('already has a captain');
    });

    it('should reject if the socket already holds a role', () => {
      service.claimCaptain('socket-1', 'MV-1');
      const result = service.claimCaptain('socket-1', 'MV-2');
      expect(result.success).toBe(false);
      expect(result.error).toContain('already hold a role');
    });

    it('should allow different sockets to captain different ships', () => {
      const r1 = service.claimCaptain('socket-1', 'MV-1');
      const r2 = service.claimCaptain('socket-2', 'MV-2');
      expect(r1.success).toBe(true);
      expect(r2.success).toBe(true);
      const state = service.getRoleState();
      expect(state.captainedShips['MV-1']).toBe('socket-1');
      expect(state.captainedShips['MV-2']).toBe('socket-2');
    });
  });

  describe('mutual exclusivity', () => {
    it('should reject Captain claim if socket already holds Command', () => {
      service.claimCommand('socket-1');
      const result = service.claimCaptain('socket-1', 'MV-1');
      expect(result.success).toBe(false);
    });

    it('should reject Command claim if socket already holds Captain', () => {
      service.claimCaptain('socket-1', 'MV-1');
      const result = service.claimCommand('socket-1');
      expect(result.success).toBe(false);
    });
  });

  describe('releaseRole', () => {
    it('should release Command and make it available again', () => {
      service.claimCommand('socket-1');
      service.releaseRole('socket-1');
      expect(service.getRoleState().commandHolder).toBeNull();

      const result = service.claimCommand('socket-2');
      expect(result.success).toBe(true);
    });

    it('should release Captain and make the ship available again', () => {
      service.claimCaptain('socket-1', 'MV-3');
      service.releaseRole('socket-1');
      expect(service.getRoleState().captainedShips['MV-3']).toBeUndefined();

      const result = service.claimCaptain('socket-2', 'MV-3');
      expect(result.success).toBe(true);
    });

    it('should be a no-op for sockets that hold no role', () => {
      service.releaseRole('nonexistent-socket');
      // Should not throw
      expect(service.getRoleState().commandHolder).toBeNull();
    });
  });

  describe('getRoleState', () => {
    it('should return an accurate snapshot', () => {
      service.claimCommand('socket-cmd');
      service.claimCaptain('socket-cap-1', 'MV-1');
      service.claimCaptain('socket-cap-2', 'MV-5');

      const state = service.getRoleState();
      expect(state.commandHolder).toBe('socket-cmd');
      expect(Object.keys(state.captainedShips)).toHaveLength(2);
      expect(state.captainedShips['MV-1']).toBe('socket-cap-1');
      expect(state.captainedShips['MV-5']).toBe('socket-cap-2');
    });
  });

  describe('getSessionRole', () => {
    it('should return null for unknown sockets', () => {
      expect(service.getSessionRole('unknown')).toBeNull();
    });

    it('should return the correct role for Command holders', () => {
      service.claimCommand('socket-1');
      expect(service.getSessionRole('socket-1')).toEqual({ role: 'COMMAND' });
    });

    it('should return the correct role and shipId for Captain holders', () => {
      service.claimCaptain('socket-1', 'MV-7');
      expect(service.getSessionRole('socket-1')).toEqual({
        role: 'CAPTAIN',
        shipId: 'MV-7',
      });
    });
  });
});
