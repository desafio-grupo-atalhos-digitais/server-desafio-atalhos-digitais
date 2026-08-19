import { Model } from 'mongoose';
import { UserDocument, UserType } from '../schemas/userSchema';
import { AutomationStatus } from '../schemas/automationSchema';

export class UserRepository {
  constructor(private readonly userModel: Model<UserDocument>) {}

  async create(data: UserType): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }

  async updateAutomationStatus(
    id: string,
    status: AutomationStatus,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { automationStatus: status }, { new: true })
      .exec();
  }
}
