import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomInt } from 'crypto';
import { Link } from './link.entity';

const ALFABETO =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const TAMANHO_CODIGO = 6;
const CACHE_TTL_SEGUNDOS = 60 * 60; // 1 hora

@Injectable()
export class LinksService {
  private readonly logger = new Logger(LinksService.name);
  constructor(
    @InjectRepository(Link)
    private readonly linksRepository: Repository<Link>,
    @Inject('REDIS')
    private readonly redis: Redis,
  ) {}

  async criar(urlOriginal: string): Promise<Link> {
    const codigo = this.gerarCodigo();
    const link = this.linksRepository.create({ urlOriginal, codigo });
    return this.linksRepository.save(link);
  }

  async buscarParaRedirecionar(codigo: string): Promise<string> {
    const url = await this.buscarUrl(codigo);
    await this.linksRepository.increment({ codigo }, 'cliques', 1);
    return url;
  }

  private async buscarUrl(codigo: string): Promise<string> {
    const chave = `link:${codigo}`;

    const urlEmCache = await this.redis.get(chave);
    if (urlEmCache) {
      this.logger.log(`cache HIT: ${codigo}`);
      return urlEmCache;
    }

    this.logger.log(`cache MISS: ${codigo}`);
    const link = await this.linksRepository.findOneBy({ codigo });
    if (!link) {
      throw new NotFoundException('Link não encontrado');
    }

    await this.redis.set(chave, link.urlOriginal, 'EX', CACHE_TTL_SEGUNDOS);
    return link.urlOriginal;
  }

  private gerarCodigo(): string {
    let codigo = '';
    for (let i = 0; i < TAMANHO_CODIGO; i++) {
      codigo += ALFABETO[randomInt(ALFABETO.length)];
    }
    return codigo;
  }
}