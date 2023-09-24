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
  private requiredGroups: Set<string> = new Set();

  /**
   * @param formCssSelector CSS Selector of `HTMLFormElement` to be validated.
   */
  public constructor(formCssSelector: string) {
    this.formCssSelector = formCssSelector;
  }

  /**
   * Queries for the `HTMLFormElement` to be validated.
   *
   * @throws "Cannot query requested HTMLFormElement." if document.querySelector does not return a `HTMLFormElement`.
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
   * Validates a specific `HTMLInputElement`.
   * Note that the `cssSelector` must be exactly the same as what was supplied through `addField`.
   *
   * @param cssSelector CSS Selector of `HTMLInputElement` to be validated.
   * @returns True if `HTMLInputElement` satisfies all supplied rules.
   * @throws "Unidentified selector. The same selector should be used with addField" if query selector has not been registered through `addField`.
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

  /**
   * Builder method that returns the `FormValidator` instance upon adding a required input group.
   *
   * @param groupName Name of input group that is required.
   * @returns current `FormValidator` instance.
   */
  public addRequiredGroup(groupName: string): FormValidator {
    this.requiredGroups.add(groupName);
    return this;
  }

  /**
   * Validates a required group. Groups are identified with fields having the same name.
   *
   * @param groupName Name of input group that is required.
   * @returns True if at least one of the inputs is checked in the group.
   */
  public validateRequiredGroup(groupName: string): boolean {
    this.queryFormElement();
    let checked = false;
    let elements = this.formElement.querySelectorAll(
      `input[name='${groupName}']`
    ) as NodeListOf<HTMLInputElement>;
    elements.forEach((element) => {
      if (element.checked) {
        checked = true;
      }
    });
    return checked;
  }

  /**
   * Validates all fields added to the validator.
   *
   * @returns True if all fields and required groups satisfy their requirements.
   */
  public validate(): boolean {
    let result = true;
    Object.keys(this.itemsToValidate).forEach((key) => {
      result &&= this.validateField(key);
    });
    this.requiredGroups.forEach((groupName) => {
      result &&= this.validateRequiredGroup(groupName);
    });
    return result;
  }
}
