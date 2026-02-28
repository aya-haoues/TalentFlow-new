// src/services/index.ts
import api from './api';
import { authService } from './api';
import { jobsService, JOB_CONSTANTS } from './jobs';
import { departmentsService } from './departments';

// 🎯 Export unique pour simplifier les imports dans les composants
export {
  api,
  authService,
  jobsService,
  departmentsService,
  JOB_CONSTANTS
};

// 💡 Usage dans un composant :
// import { jobsService, JOB_CONSTANTS } from '@/services';