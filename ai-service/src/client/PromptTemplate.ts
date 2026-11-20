/**
 * Spring AI PromptTemplate concept in TypeScript.
 * Allows defining parameterized prompt templates with {variable} syntax,
 * rendering them with type-safe models or variable dictionaries.
 */
export class PromptTemplate {
  private readonly template: string;

  constructor(template: string) {
    if (!template || typeof template !== 'string') {
      throw new Error('PromptTemplate requires a non-empty string template');
    }
    this.template = template;
  }

  /**
   * Render the template with the provided variables.
   * If a placeholder has no matching variable, it remains or can be rendered as empty.
   */
  public render(variables: Record<string, unknown> = {}): string {
    return this.template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
      if (Object.prototype.hasOwnProperty.call(variables, key)) {
        const value = variables[key];
        if (value === null || value === undefined) {
          return '';
        }
        if (typeof value === 'object') {
          return JSON.stringify(value, null, 2);
        }
        return String(value);
      }
      return match;
    });
  }

  public getRawTemplate(): string {
    return this.template;
  }
}
