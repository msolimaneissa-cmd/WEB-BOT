# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.spec.ts >> API Rate Limiting >> rate limit headers present on API responses
- Location: tests\api.spec.ts:43:7

# Error details

```
Error: apiRequestContext.get: connect ECONNREFUSED ::1:9002
Call log:
  - → GET http://localhost:9002/api/bot/health
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.7727.15 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br

```