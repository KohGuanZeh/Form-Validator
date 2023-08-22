export interface Rule {
  /** Name of the `Rule`. */
  name: string;
  /** Validation function of `Rule`. */
  fn: (inputElement: HTMLInputElement) => boolean;
}

export class ValidationField {
  /** `HTMLInputElement` to be validated. */
  private field?: HTMLInputElement;
  /** `Rule` to be used for validation of field. */
  private rule: Rule;

  /**
   * @param cssSelector CSS Selector of `HTMLInputElement` to be validated.
   * @param rule `Rule` to be used for validation.
   */
  public constructor(cssSelector: string, rule: Rule) {
    this.field = document.querySelector(cssSelector) as HTMLInputElement;
    this.rule = rule;
  }

  /**
   * Validates fields based on the given `Rule`.
   *
   * @throws Error if the `HTMLInputElement` cannot be found.
   * @returns True if `HTMLInputField` values matches its `Rule`'s validation.
   */
  public validate(): boolean {
    if (!this.field) {
      throw new Error("Field with CSS Selector cannot be found.");
    }

    return this.rule.fn(this.field);
  }
}
