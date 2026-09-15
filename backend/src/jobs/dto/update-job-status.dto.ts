import { IsEnum, IsNotEmpty } from 'class-validator';
import { JobStatus } from '../job.entity.js';

export class UpdateJobStatusDto {
  @IsEnum(JobStatus)
  @IsNotEmpty()
  status: JobStatus;
}
