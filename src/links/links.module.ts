import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Link } from './link.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Link])],
})
export class LinksModule {}
