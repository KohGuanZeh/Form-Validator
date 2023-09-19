export interface Rule {
  /** Name of the `Rule`. */
  name: string;
  /** Validation function of `Rule`. */
  fn: (inputElement: HTMLInputElement) => boolean;
}

export class FormValidator {
  /** CSS selector for `HTMLFormElement` to be validated. */
  private formCssSelector: string;
  /** `HTMLFormElement` to be validated */
  private formElement?: HTMLFormElement;
  /** Dictionary of items to be validated with CSS selector as key and set of `Rules` as values. */
  private itemsToValidate: { [key: string]: Set<Rule> } = {};

  /**
   * @param formCssSelector CSS Selector of 'HTMLFormElement` to be validated.
   */
  public constructor(formCssSelector: string) {
    this.formCssSelector = formCssSelector;
  }

  /**
   * Queries for the `HTMLFormElement` to be validated.
   * @throws "Cannot query requested HTMLFormElement." If document.querySelector does not return a HTMLFormElement.
   */
  private queryFormElement(): void {
    if (this.formElement) {
      return;
    }
    this.formElement = document.querySelector(this.formCssSelector);
    if (!this.formElement) {
      throw new Error("Cannot query requested HTMLFormElement.");
    }
  }

  /**
   * Builder method that returns the `FormValidator` instance upon adding a validation field.
   *
   * @param cssSelector CSS Selector of `HTMLInputElement` to be validated.
   * @param rules `Rule`s to be used for validation of field. Note that validation will occur as per the sequence of the rules specified for the field.
   * @returns current `FormValidator` instance.
   */
  public addField(cssSelector: string, rules: Rule[]): FormValidator {
    if (!this.itemsToValidate.hasOwnProperty(cssSelector)) {
      this.itemsToValidate[cssSelector] = new Set(rules);
    } else {
      rules.forEach((rule) => this.itemsToValidate[cssSelector].add(rule));
    }
    return this;
  }

  /**
   * Validates all fields added to the validator.
   *
   * @returns True if all fields satisfy their supplioed rules requirements.
   */
  public validate(): boolean {
    let result = true;
    Object.keys(this.itemsToValidate).forEach((key) => {
      result &&= this.validateField(key);
    });
    return result;
  }

  /**
   * Validates a specific `HTMLInputElement`.
   * Note that the `cssSelector` must be exactly the same as what was supplied through `addField`.
   *
   * @param cssSelector CSS Selector of `HTMLInputElement` to be validated.
   * @returns True if `HTMLInputElement` satisfies all supplied rules.
   */
  public validateField(cssSelector: string): boolean {
    this.queryFormElement();
    if (!this.itemsToValidate.hasOwnProperty(cssSelector)) {
      throw new Error("Unidentified selector. The same selector should be used with addField");
    }
    let inputElement = this.formElement.querySelector(cssSelector) as HTMLInputElement;
    for (const rule of this.itemsToValidate[cssSelector]) {
      if (!rule.fn(inputElement)) {
        return false;
      }
    }
    return true;
  }
}
