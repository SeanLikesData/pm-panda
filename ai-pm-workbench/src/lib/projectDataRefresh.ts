import { projectApi } from './projectApi';
import { prdApi } from './prdApi';
import { specApi } from './specApi';
import { projectEventBus } from './projectEventBus';
import type { BackendProject, BackendPRD, BackendSpec } from './types';

export interface ProjectDataRefreshResult {
  project?: BackendProject;
  prd?: BackendPRD;
  spec?: BackendSpec;
  errors: string[];
}

/**
 * Centralized function to refresh all project-related data
 * This ensures the UI stays in sync after AI agent interactions
 */
export async function refreshProjectData(projectId: number): Promise<ProjectDataRefreshResult> {
  const result: ProjectDataRefreshResult = {
    errors: []
  };

  console.log(`Refreshing all data for project ${projectId}`);

  try {
    // Refresh project data
    try {
      result.project = await projectApi.getOne(projectId);
      console.log('Project data refreshed:', result.project);
    } catch (error) {
      console.error('Failed to refresh project data:', error);
      result.errors.push('Failed to refresh project data');
    }

    // Refresh PRD data
    try {
      result.prd = await prdApi.get(projectId);
      console.log('PRD data refreshed:', result.prd);
    } catch (error) {
      // PRD might not exist yet, which is fine
      console.log('No PRD found for project (this is normal if PRD hasn\'t been created yet)');
    }

    // Refresh Spec data
    try {
      result.spec = await specApi.get(projectId);
      console.log('Spec data refreshed:', result.spec);
    } catch (error) {
      // Spec might not exist yet, which is fine
      console.log('No Spec found for project (this is normal if Spec hasn\'t been created yet)');
    }

    // Emit comprehensive update event
    projectEventBus.emit({
      projectId,
      updateType: 'all',
      data: {
        project: result.project ? {
          id: result.project.id,
          name: result.project.name,
          description: result.project.description || undefined
        } : undefined,
        prd: result.prd ? {
          id: result.prd.id,
          title: result.prd.title,
          content: result.prd.content || '',
          status: result.prd.status
        } : undefined,
        spec: result.spec ? {
          id: result.spec.id,
          title: result.spec.title,
          content: result.spec.content || '',
          technical_details: result.spec.technical_details || '',
          status: result.spec.status
        } : undefined
      },
      source: 'api',
      timestamp: new Date()
    });

    console.log('Project data refresh completed successfully');
    return result;

  } catch (error) {
    console.error('Critical error during project data refresh:', error);
    result.errors.push('Critical error during data refresh');
    return result;
  }
}

/**
 * Refresh only PRD data for a project
 */
export async function refreshPRDData(projectId: number): Promise<BackendPRD | null> {
  try {
    const prd = await prdApi.get(projectId);
    
    // Emit PRD-specific update event
    projectEventBus.emitPRDUpdate(
      projectId,
      {
        id: prd.id,
        title: prd.title,
        content: prd.content || '',
        status: prd.status
      },
      'api'
    );

    return prd;
  } catch (error) {
    console.log('No PRD found for project (this is normal if PRD hasn\'t been created yet)');
    return null;
  }
}

/**
 * Refresh only Spec data for a project
 */
export async function refreshSpecData(projectId: number): Promise<BackendSpec | null> {
  try {
    const spec = await specApi.get(projectId);
    
    // Emit Spec-specific update event
    projectEventBus.emitSpecUpdate(
      projectId,
      {
        id: spec.id,
        title: spec.title,
        content: spec.content || '',
        technical_details: spec.technical_details || '',
        status: spec.status
      },
      'api'
    );

    return spec;
  } catch (error) {
    console.log('No Spec found for project (this is normal if Spec hasn\'t been created yet)');
    return null;
  }
}
