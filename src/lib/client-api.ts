/**
 * Client-side API service for making requests to the backend
 */

export class ClientApiService {
  /**
   * Make fetch request
   */
  static async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, options)
  }

  /**
   * Post request
   */
  static async post(url: string, data: any, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data)
    })
  }

  /**
   * Get request
   */
  static async get(url: string, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'GET'
    })
  }

  /**
   * Put request
   */
  static async put(url: string, data: any, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data)
    })
  }

  /**
   * Delete request
   */
  static async delete(url: string, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'DELETE'
    })
  }
}