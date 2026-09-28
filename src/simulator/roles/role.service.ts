import { Injectable, Logger } from '@nestjs/common';

export interface RoleState {
  /** Socket ID of the user holding Command, or null if unclaimed */
  commandHolder: string | null;
  /** Map of shipId → socket ID for each captained ship */
  captainedShips: Record<string, string>;
}

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  /** Socket ID → role assignment for fast lookup on disconnect */
  private sessionRoles = new Map<
    string,
    { role: 'COMMAND' | 'CAPTAIN'; shipId?: string }
  >();

  /** The single socket ID that holds the Command role */
  private commandHolder: string | null = null;

  /** shipId → socketId — one captain per ship */
  private captainedShips = new Map<string, string>();

  /**
   * Returns a snapshot of current role availability for broadcasting to clients.
   */
  getRoleState(): RoleState {
    return {
      commandHolder: this.commandHolder,
      captainedShips: Object.fromEntries(this.captainedShips),
    };
  }

  /**
   * Attempt to claim the Command role for a given socket.
   * Fails if the socket already holds a role or Command is already taken.
   */
  claimCommand(socketId: string): { success: boolean; error?: string } {
    if (this.sessionRoles.has(socketId)) {
      return {
        success: false,
        error: 'You already hold a role. Log out first.',
      };
    }
    if (this.commandHolder !== null) {
      return {
        success: false,
        error: 'Command role is already taken by another user.',
      };
    }
    this.commandHolder = socketId;
    this.sessionRoles.set(socketId, { role: 'COMMAND' });
    this.logger.log(`[ROLE] Command claimed by socket ${socketId}`);
    return { success: true };
  }

  /**
   * Attempt to claim the Captain role for a specific ship.
   * Fails if the socket already holds a role or the ship already has a captain.
   */
  claimCaptain(
    socketId: string,
    shipId: string,
  ): { success: boolean; error?: string } {
    if (this.sessionRoles.has(socketId)) {
      return {
        success: false,
        error: 'You already hold a role. Log out first.',
      };
    }
    if (this.captainedShips.has(shipId)) {
      return {
        success: false,
        error: `Ship ${shipId} already has a captain.`,
      };
    }
    this.captainedShips.set(shipId, socketId);
    this.sessionRoles.set(socketId, { role: 'CAPTAIN', shipId });
    this.logger.log(
      `[ROLE] Captain of ${shipId} claimed by socket ${socketId}`,
    );
    return { success: true };
  }

  /**
   * Release whatever role the given socket holds (if any).
   * Called both on explicit logout and on socket disconnect.
   */
  releaseRole(socketId: string): void {
    const entry = this.sessionRoles.get(socketId);
    if (!entry) return;

    if (entry.role === 'COMMAND') {
      this.commandHolder = null;
      this.logger.log(`[ROLE] Command released by socket ${socketId}`);
    } else if (entry.role === 'CAPTAIN' && entry.shipId) {
      this.captainedShips.delete(entry.shipId);
      this.logger.log(
        `[ROLE] Captain of ${entry.shipId} released by socket ${socketId}`,
      );
    }
    this.sessionRoles.delete(socketId);
  }

  /**
   * Look up the role assignment for a specific socket (if any).
   */
  getSessionRole(
    socketId: string,
  ): { role: 'COMMAND' | 'CAPTAIN'; shipId?: string } | null {
    return this.sessionRoles.get(socketId) || null;
  }
}
