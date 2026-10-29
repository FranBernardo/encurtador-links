import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Link } from './link.entity';
import { LinksService } from './links.service';

describe('LinksService', () => {
  let service: LinksService;

  const repositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    increment: jest.fn(),
  };

  const redisMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        LinksService,
        { provide: getRepositoryToken(Link), useValue: repositoryMock },
        { provide: 'REDIS', useValue: redisMock },
      ],
    }).compile();

    service = moduleRef.get(LinksService);
  });

  describe('buscarParaRedirecionar', () => {
    it('usa a URL do cache quando ela existe (cache hit)', async () => {
      redisMock.get.mockResolvedValue('https://www.google.com');

      const url = await service.buscarParaRedirecionar('abc123');

      expect(url).toBe('https://www.google.com');
      expect(repositoryMock.findOneBy).not.toHaveBeenCalled();
      expect(repositoryMock.increment).toHaveBeenCalledWith(
        { codigo: 'abc123' },
        'cliques',
        1,
      );
    });

    it('busca no banco e guarda no cache quando não está no cache (cache miss)', async () => {
      redisMock.get.mockResolvedValue(null);
      repositoryMock.findOneBy.mockResolvedValue({
        id: '1',
        codigo: 'abc123',
        urlOriginal: 'https://github.com',
      });

      const url = await service.buscarParaRedirecionar('abc123');

      expect(url).toBe('https://github.com');
      expect(redisMock.set).toHaveBeenCalledWith(
        'link:abc123',
        'https://github.com',
        'EX',
        3600,
      );
    });

    it('lança NotFoundException quando o código não existe', async () => {
      redisMock.get.mockResolvedValue(null);
      repositoryMock.findOneBy.mockResolvedValue(null);

      await expect(service.buscarParaRedirecionar('naoexiste')).rejects.toThrow(
        NotFoundException,
      );
      expect(redisMock.set).not.toHaveBeenCalled();
      expect(repositoryMock.increment).not.toHaveBeenCalled();
    });
  });

  describe('criar', () => {
    it('gera um código de 6 caracteres e salva o link', async () => {
      repositoryMock.create.mockImplementation((dados) => dados);
      repositoryMock.save.mockImplementation(async (link) => link);

      const link = await service.criar('https://github.com');

      expect(link.urlOriginal).toBe('https://github.com');
      expect(link.codigo).toMatch(/^[a-zA-Z0-9]{6}$/);
      expect(repositoryMock.save).toHaveBeenCalled();
    });
  });
});