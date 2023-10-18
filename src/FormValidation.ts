export type ValidationStyleOptions = {
  /** CSS class names to be associated with the error message. */
  errorMsgCssClass: string | string[];
  /** Custom CSS style to be passed to the error message. */
  errorMsgCssStyle: Partial<CSSStyleDeclaration>;
  /** CSS class names to be associated with the invalid field on error. */
  errorFieldCssClass: string | string[];
  /** Custom CSS style to be passed to the invalid field on error. */
  errorFieldCssStyle: Partial<CSSStyleDeclaration>;
  /** CSS class names to be associated with the success message. */
  successMsgCssClass: string | string[];
  /** Custom CSS style to be passed to the success message. */
  successMsgCssStyle: Partial<CSSStyleDeclaration>;
  /** CSS class names to be associated with the valid field on success. */
  successFieldCssClass: string | string[];
  /** Custom CSS style to be passed to the valid field on success. */
  successFieldCssStyle: Partial<CSSStyleDeclaration>;
  /** Parent element for the message. */
  msgContainer?: HTMLElement;
};

export const globalDefaultStyleOptions: Readonly<ValidationStyleOptions> = {
  errorMsgCssClass: "validator-error-msg",
  errorMsgCssStyle: { color: "#cc0000" },
  errorFieldCssClass: "validator-error-field",
  errorFieldCssStyle: { color: "#cc0000", border: "1px solid #cc0000" },
  successMsgCssClass: "validator-success-msg",
  successMsgCssStyle: { color: "#4caf50" },
  successFieldCssClass: "validator-success-field",
  successFieldCssStyle: { color: "#4caf50", border: "1px solid #4caf50" },
};

export type Rule = {
  /** Name of the rule. */
  name: string;
  /** Error message to be shown if validation fails. */
  errorMsg: string;
  /** Validation function associated with the rule. */
  fn: (inputElement: HTMLInputElement) => boolean;
};

type ValidationItems = {
  /** Field validation status. */
  isValid: boolean;
  /** Style options to be applied to the particular field. */
  style: ValidationStyleOptions;
  /** Element that indicates error for the field. */
  msgElement?: HTMLElement;
  /** Store the field's original CSS text */
  originalFieldCssText?: string;
};

type FieldValidationItems = ValidationItems & {
  /** Set of rules to apply to field to be validated. */
  rules: Set<Rule>;
};

type GroupValidationItems = ValidationItems & {
  /** Custom error message for required group validation. */
  errorMsg: string;
};

export class FormValidator {
  /** HTML form element to be validated. */
  private formElement: HTMLFormElement;
  /** CSS selectors of fields that are to be validated. */
  private itemsToValidate: { [key: string]: FieldValidationItems } = {};
  /** Group names that requires at least one input to be checked in the group. */
  private requiredGroups: { [key: string]: GroupValidationItems } = {};
  /** Default style options for invalid fields and groups. */
  private defaultStyleConfigs: ValidationStyleOptions = JSON.parse(
    JSON.stringify(globalDefaultStyleOptions)
  );
  /** Submission callback to be fired upon successful validation on submit. */
  private submitCallback = (event: SubmitEvent) => {};

  /**
   * Form validator constructor. By default, it uses globalDefaultStyleConfigs for styling.
   *
   * @param formCssSelector CSS Selector of HTML form element to be validated.
   * @param styleOptions  Default style options to be applied to validator.
   *    Included properties will overwrite the default style options for this validator instance.
   *
   * @throws "Cannot query requested HTMLFormElement." if specified HTML form element cannot be found.
   */
  public constructor(formCssSelector: string, styleOptions: Partial<ValidationStyleOptions> = {}) {
    this.formElement = document.querySelector(formCssSelector) as HTMLFormElement;
    if (!this.formElement) {
      throw new Error("Cannot query requested HTMLFormElement.");
    }

    this.overwriteStyleOptions(this.defaultStyleConfigs, styleOptions);

    this.formElement.addEventListener("submit", (event) => {
      if (!this.validate()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      this.submitCallback(event);
    });
  }

  /**
   * Builder method that adds the submission callback to the submit event listener of the form element.
   * The callback will only fire when the declared fields are valid.
   * If a previous callback already exists, it will be overwritten.
   *
   * @param submitCallback Function to call after successful validation of form on submit.
   * @returns Current validator instance.
   */
  public onSubmit(submitCallback: (event: SubmitEvent) => void): FormValidator {
    this.submitCallback = submitCallback;
    return this;
  }

  /**
   * Builder method that adds a input field to be validated based on the fields.
   *
   * @param cssSelector CSS Selector of the input field to be validated.
   * @param rules Rules to be used for validation of the field.
   *    Rules will be appended to the list of existing rules.
   *    Note that validation will occur as per the sequence of the rules specified for the field.
   * @param styleOptions Style options to be applied to the validation field that will overwrite the default.
   *    If called on an existing registered field, only properties passed will be overwritten.
   * @returns current validator instance.
   */
  public addField(
    cssSelector: string,
    rules: Rule[],
    styleOptions: Partial<ValidationStyleOptions> = {}
  ): FormValidator {
    if (this.itemsToValidate.hasOwnProperty(cssSelector)) {
      rules.forEach((rule) => this.itemsToValidate[cssSelector].rules.add(rule));
      this.overwriteStyleOptions(this.itemsToValidate[cssSelector].style, styleOptions);
    } else {
      let style = JSON.parse(JSON.stringify(this.defaultStyleConfigs));
      this.overwriteStyleOptions(style, styleOptions);
      this.itemsToValidate[cssSelector] = {
        isValid: false,
        style: style,
        rules: new Set(rules),
      };
    }
    return this;
  }

  /**
   * Validates a specific HTML input element.
   * Note that the CSS selector must be exactly the same as the field supplied through the addField function.
   * @see addField for adding fields to be validated.
   *
   * @param cssSelector CSS selector of HTML input element to be validated.
   * @returns True if and only if the input field satisfies all supplied rules.
   *
   * @throws "Cannot query requested HTMLFormElement." if the specified HTML form element cannot be found.
   * @throws "Unidentified selector. The same selector should be used with addField" if query selector has not been registered through addField function.
   * @throws "CSS Selector is not referring to an input element." if query selector passed is not referring to an HTML input element.
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

    let element = this.itemsToValidate[cssSelector].msgElement ?? document.createElement("div");
    if (this.itemsToValidate[cssSelector].msgElement == undefined) {
      element.hidden = true;
      if (this.itemsToValidate[cssSelector].style.msgContainer) {
        this.itemsToValidate[cssSelector].style.msgContainer?.appendChild(element);
      } else {
        inputElement.insertAdjacentElement("afterend", element);
      }
      this.itemsToValidate[cssSelector].msgElement = element;
    }

    for (const rule of this.itemsToValidate[cssSelector].rules) {
      if (!rule.fn(inputElement)) {
        // Change style and class
        this.itemsToValidate[cssSelector].isValid = false;
        element.innerHTML = rule.errorMsg;
        element.hidden = false;
        return false;
      }
    }
    // Change style and class
    // If success message exists, display it instead.
    element.hidden = true;
    return true;
  }

  /**
   * Builder method that returns the validator instance upon adding a required input group.
   * If the same group name is passed, the newly passed errorMsg and included properties of the styleOptions added group will be overwritten.
   *
   * @param groupName Name of input group that is required.
   * @param errorMsg Custom error message to show if required group is not met.
   * @param styleOptions Style options to be applied to the required group that will overwrite the default.
   *    If called on an existing registered group, only properties passed will be overwritten.
   *
   * @returns current validator instance.
   */
  public addRequiredGroup(
    groupName: string,
    errorMsg: string = "Group is required.",
    styleOptions: Partial<ValidationStyleOptions> = {}
  ): FormValidator {
    if (this.requiredGroups.hasOwnProperty(groupName)) {
      this.requiredGroups[groupName].errorMsg = errorMsg;
      this.overwriteStyleOptions(this.requiredGroups[groupName].style, styleOptions);
    } else {
      let style = JSON.parse(JSON.stringify(this.defaultStyleConfigs));
      this.overwriteStyleOptions(style, styleOptions);
      this.requiredGroups[groupName] = {
        isValid: false,
        errorMsg: errorMsg,
        style: style,
      };
    }
    return this;
  }

  /**
   * Validates a required group. Groups are identified with fields having the same name.
   * Group name has to be added into the validator instance before it can be validated.
   *
   * @param groupName Name of input group that is required.
   * @returns True if at least one of the inputs is checked in the group.
   *
   * @throws "Cannot query requested HTMLFormElement." if specified HTML form element cannot be found.
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

  /**
   * Overwrites the existing style option properties with the new one.
   * Only properties added in the new style options will be taken.
   * Existing properties that are not in the new style options will remain.
   *
   * @param currentStyle Current style options. Properties will be mutated based on new style options passed.
   * @param newStyle New style options. A copy will be created to prevent unwanted mutation.
   */
  private overwriteStyleOptions(
    currentStyle: ValidationStyleOptions,
    newStyle: Partial<ValidationStyleOptions>
  ) {
    newStyle = JSON.parse(JSON.stringify(newStyle));
    Object.keys(newStyle).forEach((prop) => {
      currentStyle[prop] = newStyle[prop];
    });
  }
}
