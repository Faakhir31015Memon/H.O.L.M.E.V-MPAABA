// Context & Memory Manager for H.O.L.M.E.V
// Maintains structured user preferences, conversation history, and entity resolution

export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
}

export interface UserMemoryProfile {
  userTitle: string;
  preferredLanguage: 'roman_urdu' | 'urdu' | 'english' | 'hindi';
  activeRoomContext?: string;
  lastTargetDevice?: string;
  customPreferences: Record<string, string>;
}

export class MemoryManager {
  private history: ConversationTurn[] = [];
  private profile: UserMemoryProfile = {
    userTitle: 'Mister Memon',
    preferredLanguage: 'roman_urdu',
    customPreferences: {},
  };

  public getProfile(): UserMemoryProfile {
    return { ...this.profile };
  }

  public setUserTitle(title: string) {
    this.profile.userTitle = title;
  }

  public addTurn(role: 'user' | 'assistant' | 'tool', content: string) {
    this.history.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });
    if (this.history.length > 30) {
      this.history.shift();
    }
  }

  public getRecentHistory(count = 6): Array<{ role: 'user' | 'assistant' | 'system' | 'tool'; content: string }> {
    return this.history.slice(-count).map((h) => ({ role: h.role, content: h.content }));
  }

  public clearHistory() {
    this.history = [];
  }

  // Multi-Turn Context & Entity Resolution (e.g. "Bedroom fan off" -> "aur light bhi")
  public resolveContextualQuery(query: string): { resolvedRoom?: string; resolvedDevice?: string } {
    const lower = query.toLowerCase();

    // Check for rooms in query
    const rooms = ['bedroom', 'hallway', 'hall', 'living room', 'kitchen', 'entrance'];
    const foundRoom = rooms.find((r) => lower.includes(r));
    if (foundRoom) {
      this.profile.activeRoomContext = foundRoom.replace('hall', 'Hallway').replace('bedroom', 'Bedroom');
    }

    // Check for devices in query
    const devices = ['fan', 'pankha', 'light', 'batti', 'ac', 'tv', 'camera'];
    const foundDevice = devices.find((d) => lower.includes(d));
    if (foundDevice) {
      this.profile.lastTargetDevice = foundDevice === 'pankha' ? 'fan' : foundDevice === 'batti' ? 'light' : foundDevice;
    }

    return {
      resolvedRoom: this.profile.activeRoomContext,
      resolvedDevice: this.profile.lastTargetDevice,
    };
  }
}

export const memoryManager = new MemoryManager();
