export interface Rule {
  /** Name of the `Rule`. */
  name: string;
  /** Validation function of `Rule`. */
  fn: (inputElement: HTMLInputElement) => boolean;
}

export class FormValidator {
  /** `HTMLFormElement` to be validated */
  private formElement: HTMLFormElement;
  /** Dictionary of items to be validated with CSS selector as key and set of `Rules` as values. */
  private itemsToValidate: { [key: string]: Set<Rule> } = {};
  private requiredGroups: Set<string> = new Set();

  /**
   * @param formCssSelector CSS Selector of `HTMLFormElement` to be validated.
   * @param submitCallback Function to fire after successful validation of form on submit.
   * @throws "Cannot query requested HTMLFormElement." if specified `HTMLFormElement` cannot be found.
   */
  public constructor(formCssSelector: string, submitCallback: () => void = () => {}) {
    this.formElement = document.querySelector(formCssSelector);
    if (!this.formElement) {
      throw new Error("Cannot query requested HTMLFormElement.");
    }
    this.formElement.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        if (!this.validate()) {
          event.stopPropagation();
          return;
        }
        submitCallback();
      },
      { capture: true }
    );
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
   * @throws "Cannot query requested HTMLFormElement." if specified `HTMLFormElement` cannot be found.
   * @throws "Unidentified selector. The same selector should be used with addField" if query selector has not been registered through `addField`.
   * @throws "CSS Selector is not referring to an input element." if query selector passed is not referring to an HTMLInputElement.
   */
  public validateField(cssSelector: string): boolean {
    if (!this.formElement) {
      throw new Error("Cannot query requested HTMLFormElement.");
    }

    if (!this.itemsToValidate.hasOwnProperty(cssSelector)) {
      throw new Error("Unidentified selector. The same selector should be used with addField");
    }
    let inputElement = this.formElement.querySelector(cssSelector);
    if (!(inputElement instanceof HTMLInputElement)) {
      throw new Error("CSS Selector is not referring to an input element.");
    }
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
   * @throws "Cannot query requested HTMLFormElement." if specified `HTMLFormElement` cannot be found.
   * @returns True if at least one of the inputs is checked in the group.
   */
  public validateRequiredGroup(groupName: string): boolean {
    if (!this.formElement) {
      throw new Error("Cannot query requested HTMLFormElement.");
    }

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
