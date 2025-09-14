// Enhanced event bus for comprehensive project updates
export type ProjectUpdateEvent = {
  projectId: number;
  updateType: 'prd' | 'spec' | 'project' | 'all';
  data?: {
    prd?: {
      id?: number;
      title: string;
      content: string;
      status: string;
    };
    spec?: {
      id?: number;
      title: string;
      content: string;
      technical_details?: string;
      status: string;
    };
    project?: {
      id: number;
      name: string;
      description?: string;
    };
  };
  source: 'ai-agent' | 'manual' | 'api';
  timestamp: Date;
};

type EventCallback = (event: ProjectUpdateEvent) => void;

class ProjectEventBus {
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

  emit(event: ProjectUpdateEvent): void {
    console.log('ProjectEventBus: Emitting event', event);
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in project event listener:', error);
      }
    });
  }

  // Convenience methods for specific update types
  emitPRDUpdate(projectId: number, prdData: ProjectUpdateEvent['data']['prd'], source: ProjectUpdateEvent['source'] = 'manual') {
    this.emit({
      projectId,
      updateType: 'prd',
      data: { prd: prdData },
      source,
      timestamp: new Date()
    });
  }

  emitSpecUpdate(projectId: number, specData: ProjectUpdateEvent['data']['spec'], source: ProjectUpdateEvent['source'] = 'manual') {
    this.emit({
      projectId,
      updateType: 'spec',
      data: { spec: specData },
      source,
      timestamp: new Date()
    });
  }

  emitProjectUpdate(projectId: number, projectData: ProjectUpdateEvent['data']['project'], source: ProjectUpdateEvent['source'] = 'manual') {
    this.emit({
      projectId,
      updateType: 'project',
      data: { project: projectData },
      source,
      timestamp: new Date()
    });
  }

  emitFullRefresh(projectId: number, source: ProjectUpdateEvent['source'] = 'ai-agent') {
    this.emit({
      projectId,
      updateType: 'all',
      source,
      timestamp: new Date()
    });
  }
}

// Export singleton instance
export const projectEventBus = new ProjectEventBus();
