import { ActivityEntity } from '../entities/activity.entity';
import { ActivityType, CreateActivityType, UpdateActivityType, ActivityQueryParams } from '../types/activity.type';
import { PaginatedResponse } from '../types/pagination.type';

export interface IActivityRepository {
  createActivity: (activity: CreateActivityType) => Promise<ActivityType>;
  uploadActivities: (formData: any) => Promise<void>;
  updateActivity: (id: string, activity: UpdateActivityType) => Promise<ActivityType | null>;
  deleteActivity: (id: string) => Promise<boolean>;
  getAllActivities: (params?: ActivityQueryParams) => Promise<PaginatedResponse<ActivityEntity>>;
  getActivityById: (id: string) => ActivityEntity | null;

  allActivitiesData?: PaginatedResponse<ActivityEntity>;
  isLoadingAllActivities: boolean;
  isFetchingAllActivities: boolean;
  allActivitiesError?: any;
  // refetchAllIndustries: () => void;

  currentActivityData?: ActivityEntity | null;
  isLoadingActivityById: boolean;
  isFetchingActivityById: boolean;
  activityByIdError?: any;
  // refetchIndustryById: () => void;

  isMutationLoading: boolean;
  isMutationSuccess: boolean;
  isMutationError: boolean;
  mutationError?: any;
}
