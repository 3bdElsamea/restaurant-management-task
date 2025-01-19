import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
      db: this.configService.get<number>('REDIS_DB'),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });

    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.client.on('connect', () => {
      console.log('Successfully connected to Redis');
    });

    this.client.on('ready', () => {
      console.log('Redis client is ready to serve commands');
    });
  }

  async getCache(key: string) {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async setCache(key: string, data: any, ttl: number) {
    try {
      await this.client.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (error) {
      console.error('Failed to set cache:', error);
    }
  }
}
