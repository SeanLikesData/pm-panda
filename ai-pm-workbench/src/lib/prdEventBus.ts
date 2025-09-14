// Event bus for PRD updates to enable real-time UI synchronization
type PRDUpdateEvent = {
  projectId: number;
  prdData: {
    id?: number;
    title: string;
    content: string;
    status: string;
  };
  source: 'ai-agent' | 'manual';
};

type EventCallback = (event: PRDUpdateEvent) => void;

class PRDEventBus {
  private listeners: EventCallback[] = [];

  subscribe(callback: EventCallback): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  emit(event: PRDUpdateEvent): void {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in PRD event listener:', error);
      }
    });
  }
}

// Export singleton instance
export const prdEventBus = new PRDEventBus();
export type { PRDUpdateEvent };
