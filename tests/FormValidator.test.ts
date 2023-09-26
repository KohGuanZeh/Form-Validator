import { Rule, FormValidator } from "../src/FormValidation";

const anyARule: Rule = {
  name: "Is Case Insensitve A",
  fn: (field) => field.value.toLowerCase() === "a",
};

const upperCaseARule: Rule = {
  name: "Is Upper Case A",
  fn: (field) => field.value == "A",
};

describe("Test constructor", () => {
  test("Constructor should throw error if HTMLFormElement cannot be found.", () => {
    document.body.innerHTML = `
    <form>
      <input type="text"/>
    </form>
    `;
    expect(() => new FormValidator("#someOtherForm")).toThrowError(
      "Cannot query requested HTMLFormElement."
    );
  });
});

describe("Test validateField", () => {
  let validator: FormValidator;
  let inputField: HTMLInputElement;
  beforeEach(() => {
    document.body.innerHTML = `
    <form>
      <input name="input-1" type="text"/>
      <span class="dummy-element"/>
    </form>
    `;
    validator = new FormValidator("form");
    inputField = document.querySelector("input") as HTMLInputElement;
  });

  test("validateField should return true if input matching selector passes all supplied rules", () => {
    validator.addField("input", [anyARule, upperCaseARule]);
    inputField.value = "A";
    expect(validator.validateField("input")).toStrictEqual(true);
  });

  test("validateField should throw error if selector was not registered under addField", () => {
    validator.addField("input", [anyARule, upperCaseARule]);
    inputField.value = "A";
    let unAddedSelector = "[name='input-1']";
    expect(document.querySelector(unAddedSelector)).toStrictEqual(inputField);
    expect(() => validator.validateField(unAddedSelector)).toThrowError(
      "Unidentified selector. The same selector should be used with addField"
    );
  });

  test("validateField should throw error if selector registered is not an HTMLInputElement", () => {
    validator.addField(".dummy-element", [anyARule]);
    expect(() => validator.validateField(".dummy-element")).toThrowError(
      "CSS Selector is not referring to an input element."
    );
  });
});

describe("Test validateRequiredGroup", () => {
  test("validateRequiredGroup should return true if at least one input in the group is checked.", () => {
    document.body.innerHTML = `
    <form>
      <input name="required-group" type="radio" value="1">
      <input name="required-group" type="radio" value="2">
      <input name="required-group" type="checkbox" value="3">
    </form>
    `;
    let validator = new FormValidator("form");
    let options = document.querySelectorAll("input");
    options[1].checked = true;
    expect(validator.validateRequiredGroup("required-group")).toStrictEqual(true);
  });
});

describe("Test validate", () => {
  let validator: FormValidator;
  beforeEach(() => {
    document.body.innerHTML = `
    <form>
      <input name="input-1" type="text">
      <input name="input-2" type="text">
      <input name="required-group" type="radio" value="1">
      <input name="required-group" type="radio" value="2">
      <input name="required-group" type="checkbox" value="3">
    </form>
    `;
    validator = new FormValidator("form");
  });

  test("validate should return true if all fields and required groups meet their requirements", () => {
    let inputField1 = document.querySelector("[name='input-1']") as HTMLInputElement;
    let inputField2 = document.querySelector("[name='input-2']") as HTMLInputElement;
    let groupInputs = document.querySelectorAll(
      "[name='required-group']"
    ) as NodeListOf<HTMLInputElement>;

    validator.addField("[name='input-1']", [anyARule, upperCaseARule]);
    validator.addField("[name='input-2']", [anyARule]);
    validator.addRequiredGroup("required-group");

    inputField1.value = "A";
    inputField2.value = "a";

    expect(validator.validate()).toStrictEqual(false);

    groupInputs[1].checked = true;

    expect(validator.validate()).toStrictEqual(true);
  });
});

describe("Test submission", () => {
  test("Form submission should pass if and only if validation passes.", () => {
    document.body.innerHTML = `
    <form>
      <input name="input-1" type="text">
      <input name="input-2" type="text">
      <input name="required-group" type="radio" value="1">
      <input name="required-group" type="radio" value="2">
      <input name="required-group" type="radio" value="3">
      <input type="submit" value="Submit"/>
    </form>
    `;
    let submitted = false;

    let validator = new FormValidator("form", () => {
      submitted = true;
    })
      .addField("[name='input-1']", [anyARule])
      .addField("[name='input-2']", [anyARule, upperCaseARule])
      .addRequiredGroup("required-group");

    let inputField1 = document.querySelector("[name='input-1']") as HTMLInputElement;
    let inputField2 = document.querySelector("[name='input-2']") as HTMLInputElement;
    let groupInputs = document.querySelectorAll(
      "[name='required-group']"
    ) as NodeListOf<HTMLInputElement>;
    let submitButton = document.querySelector("[type='submit']") as HTMLInputElement;

    inputField1.value = "a";
    inputField2.value = "Some wrong value";
    groupInputs[2].checked = true;
    submitButton.click();

    expect(submitted).toStrictEqual(false);

    inputField2.value = "A";
    submitButton.click();

    expect(submitted).toStrictEqual(true);
  });
});
