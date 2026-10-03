import { getHowToBuy } from './useApi';
import { api } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('@US3-EC1 getHowToBuy returns text from API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns text when API response contains text property', async () => {
    mockedApi.get.mockResolvedValue({
      data: { text: 'Custom how to buy text' },
    });

    const result = await getHowToBuy();
    expect(result).toBe('Custom how to buy text');
    expect(mockedApi.get).toHaveBeenCalledWith('/public/how-to-buy');
  });

  it('@US2-AS2 returns null when text is null', async () => {
    mockedApi.get.mockResolvedValue({
      data: { text: null },
    });

    const result = await getHowToBuy();
    expect(result).toBeNull();
  });

  it('@US2-FE1 returns null when text is undefined', async () => {
    mockedApi.get.mockResolvedValue({
      data: { text: undefined },
    });

    const result = await getHowToBuy();
    expect(result).toBeNull();
  });

  it('@US6-AS3 returns null when data has no text property', async () => {
    mockedApi.get.mockResolvedValue({
      data: {},
    });

    const result = await getHowToBuy();
    expect(result).toBeNull();
  });

  it('@US6-EC2 returns null when response data is null', async () => {
    mockedApi.get.mockResolvedValue({
      data: null,
    });

    const result = await getHowToBuy();
    expect(result).toBeNull();
  });

  it('preserves newlines in text content', async () => {
    const textWithNewlines = 'Line 1\n\nLine 2\n\nLine 3';
    mockedApi.get.mockResolvedValue({
      data: { text: textWithNewlines },
    });

    const result = await getHowToBuy();
    expect(result).toContain('\n\n');
    expect(result).toBe(textWithNewlines);
  });

  it('returns empty string when text is empty string', async () => {
    mockedApi.get.mockResolvedValue({
      data: { text: '' },
    });

    const result = await getHowToBuy();
    expect(result).toBe('');
  });

  it('returns whitespace-only text as is', async () => {
    mockedApi.get.mockResolvedValue({
      data: { text: '   \n\n   ' },
    });

    const result = await getHowToBuy();
    expect(result).toBe('   \n\n   ');
  });
});

describe('@US3-AS1 getHowToBuy API errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('propagates API errors', async () => {
    const error = new Error('Network error');
    mockedApi.get.mockRejectedValue(error);

    await expect(getHowToBuy()).rejects.toThrow('Network error');
  });

  it('calls the correct API endpoint', async () => {
    mockedApi.get.mockResolvedValue({ data: { text: 'test' } });

    await getHowToBuy();
    expect(mockedApi.get).toHaveBeenCalledWith('/public/how-to-buy');
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
  });
});
