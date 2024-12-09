import { CreateUserDto } from './create.dto';

export class UpdateUserDto implements Partial<Omit<CreateUserDto, 'password'>> {}
