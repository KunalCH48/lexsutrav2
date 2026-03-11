import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchWebsite } from '@/lib/fetch-website'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchWebsite — quality scoring', () => {
  it('returns quality=good when Jina returns >300 chars', async () => {
    const richContent = 'AI-powered recruitment platform '.repeat(15) // 480 chars
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(richContent),
      } as unknown as Response)
    )

    const result = await fetchWebsite('https://example.com')

    expect(result.quality).toBe('good')
    expect(result.content.length).toBeGreaterThan(300)
  })

  it('returns quality=partial when Jina returns empty but meta tags return ~100 chars', async () => {
    // Minimal HTML — just enough for extractMeta to produce ~100 chars total
    const metaHtml =
      '<html><head>' +
      '<title>AI Analytics Company</title>' +
      '<meta name="description" content="Analytics platform for data insights">' +
      '</head><body></body></html>'

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (String(url).includes('jina.ai')) {
          // Jina returns empty — triggers fallback
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(''),
          } as unknown as Response)
        }
        // Home page + /about both return the same minimal HTML
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(metaHtml),
        } as unknown as Response)
      })
    )

    const result = await fetchWebsite('https://example.com')

    expect(result.quality).toBe('partial')
    expect(result.content.length).toBeGreaterThanOrEqual(50)
    expect(result.content.length).toBeLessThanOrEqual(300)
  })

  it('returns quality=failed when all fetch strategies throw network errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error — connection refused'))
    )

    const result = await fetchWebsite('https://example.com')

    expect(result.quality).toBe('failed')
    expect(result.content).toBe('')
  })
})
