import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Injectable()
export class AppService {
  constructor(private readonly supabaseService: SupabaseService) {}

  getHello(): string {
    return 'Hello World!';
  }

  getSupabaseInfo(): { projectUrl: string } {
    return { projectUrl: this.supabaseService.getProjectUrl() };
  }
}
