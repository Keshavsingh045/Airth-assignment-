import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus } from './job.entity.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { Subject } from 'rxjs';

@Injectable()
export class JobsService {
  public jobUpdates$ = new Subject<Job>();

  constructor(
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
  ) {}

  async create(createJobDto: CreateJobDto): Promise<Job> {
    const job = this.jobsRepository.create({
      ...createJobDto,
      status: JobStatus.PENDING,
    });
    const savedJob = await this.jobsRepository.save(job);
    this.jobUpdates$.next(savedJob);
    return savedJob;
  }

  async findAll(): Promise<Job[]> {
    return this.jobsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async updateStatus(id: string, newStatus: JobStatus): Promise<Job> {
    const job = await this.jobsRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    const currentStatus = job.status;

    if (currentStatus === JobStatus.COMPLETED || currentStatus === JobStatus.FAILED) {
      throw new BadRequestException(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }

    if (currentStatus === JobStatus.PENDING && newStatus !== JobStatus.RUNNING && newStatus !== JobStatus.COMPLETED && newStatus !== JobStatus.FAILED) {
      throw new BadRequestException(`Invalid transition from ${currentStatus} to ${newStatus}`);
    }

    if (currentStatus === JobStatus.RUNNING && (newStatus === JobStatus.PENDING || newStatus === JobStatus.RUNNING)) {
        throw new BadRequestException(`Invalid transition from ${currentStatus} to ${newStatus}`);
    }

    const updateResult = await this.jobsRepository.update(
      { id, status: currentStatus },
      { status: newStatus }
    );

    if (updateResult.affected === 0) {
      throw new ConflictException(
        `Job status was modified by another request. Could not update from ${currentStatus} to ${newStatus}.`
      );
    }

    const updatedJob = await this.jobsRepository.findOne({ where: { id } });
    if (updatedJob) {
      this.jobUpdates$.next(updatedJob);
    }
    
    return updatedJob!;
  }

  async remove(id: string): Promise<void> {
    const result = await this.jobsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
  }
}
