import { Expose } from 'class-transformer';

export class CustomerDto {
  @Expose()
  name: string;

  @Expose()
  phone: string;

  @Expose()
  email: string;
}
