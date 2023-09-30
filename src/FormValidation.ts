export interface ValidationStyleConfigs {
  /** Class names to be associated with the error message. */
  errorMsgClass: string | string[];
  /** Custom style to be passed to the error message. */
  errorMsgStyle: Partial<CSSStyleDeclaration>;
  /** Class names to be associated with the invalid field on error. */
  errorFieldClass: string | string[];
  /** Custom style to be passed to the invalid field on error. */
  errorFieldStyle: Partial<CSSStyleDeclaration>;
  /** Parent element for message. */
  msgContainer?: HTMLElement;
}

export const globalDefaultStyleConfigs: ValidationStyleConfigs = {
  errorMsgClass: "validator-error-msg",
  errorMsgStyle: {},
  errorFieldClass: "validator-error-field",
  errorFieldStyle: {},
};

export interface Rule {
  /** Name of the `Rule`. */
  name: string;
  /** Error message to be shown if validation fails. */
  errorMsg: string;
  /** Validation function of `Rule`. */
  fn: (inputElement: HTMLInputElement) => boolean;
}

interface ValidationItems {
  /** Field validation status. */
  isValid: boolean;
  /** `ValidationStyleConfigs` to be applied to this field.
   * Overwrites the default `ValidationStyleConfigs` in the FormValidator for the particular field. */
  style: ValidationStyleConfigs;
  /** Element that indicates error for the field. */
  errorElement?: HTMLElement;
}

interface FieldValidationItems extends ValidationItems {
  /** Set of rules to apply to field to be validated. */
  rules: Set<Rule>;
}

interface GroupValidationItems extends ValidationItems {
  /** Custom error message for required group validation. */
  errorMsg: string;
}

export class FormValidator {
  /** `HTMLFormElement` to be validated. */
  private formElement: HTMLFormElement;
  /** Dictionary of items to be validated with CSS selector as key and set of `Rules` as values. */
  private itemsToValidate: { [key: string]: Set<Rule> } = {};
  /** Group names that requires at least one input to be checked in the group. */
  private requiredGroups: { [key: string]: GroupValidationItems } = {};
  /** Default `ValidationStyleConfigs` for invalid fields and groups. */
  private defaultStyleConfigs: ValidationStyleConfigs;

  /**
   * @param formCssSelector CSS Selector of `HTMLFormElement` to be validated.
   * @param submitCallback Function to call after successful validation of form on submit. By default it is null.
   * If no function is passed, validator will not automatically validate on submit.
   * @param defaultStyleConfigs Default `ValidationStyleConfigs` to be applied to validator.
   * @throws "Cannot query requested HTMLFormElement." if specified `HTMLFormElement` cannot be found.
   */
  public constructor(
    formCssSelector: string,
    submitCallback: (() => void) | null = null,
    defaultStyleConfigs: ValidationStyleConfigs = globalDefaultStyleConfigs
  ) {
    this.formElement = document.querySelector(formCssSelector) as HTMLFormElement;
    if (!this.formElement) {
      throw new Error("Cannot query requested HTMLFormElement.");
    }

    this.defaultStyleConfigs = defaultStyleConfigs;

    // Loose check for null
    if (submitCallback != null) {
      this.validateOnSubmit(submitCallback);
    }
  }

  /**
   * Adds the submission callback to the submit event listener of the `HTMLFormElement`.
   * The callback will only fire when the declared fields are valid.
   *
   * @param submitCallback Function to call after successful validation of form on submit.
   */
  private validateOnSubmit(submitCallback: () => void): void {
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
   * If same group name was passed, errorMsg and stlyeConfigs (provided it is not `null`) of the added group will be overwritten.
   *
   * @param groupName Name of input group that is required.
   * @param errorMsg Custom error message to show if required group is not met.
   * @param styleConfigs `ValidationStyleConfigs` to be applied to required group.
   * @returns current `FormValidator` instance.
   */
  public addRequiredGroup(
    groupName: string,
    errorMsg: string = "Group is required.",
    styleConfigs: ValidationStyleConfigs | null = null
  ): FormValidator {
    if (this.requiredGroups.hasOwnProperty(groupName)) {
      this.requiredGroups[groupName].errorMsg = errorMsg;
      if (styleConfigs) {
        this.requiredGroups[groupName].style = styleConfigs;
      }
    } else {
      this.requiredGroups[groupName] = {
        isValid: false,
        errorMsg: errorMsg,
        style: styleConfigs ? styleConfigs : this.defaultStyleConfigs,
      };
    }
    return this;
  }

  /**
   * Validates a required group. Groups are identified with fields having the same name.
   * Group name has to be added into the `FormValidator` for validation to work.
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

    this.requiredGroups[groupName].isValid = checked;
    if (!checked) {
      // Show Validation Error Message
    }

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
    Object.keys(this.requiredGroups).forEach((key) => {
      result &&= this.validateRequiredGroup(key);
    });
    return result;
  }
}
