import { Model } from 'mongoose';
import {
  AutomationDocument,
  AutomationStatus,
  AutomationType,
} from '../schemas/automationSchema';

export class AutomationRepository {
  constructor(private readonly automationModel: Model<AutomationDocument>) {}

  async create(data: AutomationType): Promise<AutomationDocument> {
    const automation = new this.automationModel(data);
    return automation.save();
  }

  async findById(id: string): Promise<AutomationDocument | null> {
    return this.automationModel.findById(id).exec();
  }

  async findByCandidateId(candidateId: string): Promise<AutomationDocument[]> {
    return this.automationModel
      .find({ candidateId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findLatestByCandidateId(
    candidateId: string,
  ): Promise<AutomationDocument | null> {
    return this.automationModel
      .findOne({ candidateId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateStatus(
    id: string,
    status: AutomationStatus,
    lastError?: string | null,
  ): Promise<AutomationDocument | null> {
    return this.automationModel
      .findByIdAndUpdate(
        id,
        {
          status,
          ...(lastError !== undefined ? { lastError } : {}),
        },
        { new: true },
      )
      .exec();
  }

  async incrementAttempts(
    id: string,
    lastError?: string,
  ): Promise<AutomationDocument | null> {
    return this.automationModel
      .findByIdAndUpdate(
        id,
        {
          $inc: { attempts: 1 },
          ...(lastError !== undefined ? { lastError } : {}),
        },
        { new: true },
      )
      .exec();
  }
}
