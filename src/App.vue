<template>
  <v-app>
    <v-app-bar app color="primary" dark />
    <v-main>
      <v-form>
        <section class="cards">
          <v-card>
            <v-card-text>
              <v-switch
                v-model="switchValidation.value"
                label="Validate Name"
              ></v-switch>
              <v-text-field
                v-model="myForm.get('name').value"
                label="Async Validation: type Clementina"
                :error-messages="myForm.controls.name.errorsMessages"
              ></v-text-field>
              <v-text-field
                v-model="myForm.get('age').value"
                label="Type a number"
                type="number"
                :disabled="!myForm.controls.age.enabled"
                :error-messages="myForm.controls.age.errorsMessages"
              ></v-text-field>
            </v-card-text>
          </v-card>
        </section>
        <br />
        <section class="cards">
          <v-card>
            <v-card-title class="card-title"
              >contacts
              <v-btn @click="addContactFied">Add Contact</v-btn>
            </v-card-title>
            <v-card-text>
              <v-row
                v-for="(item, index) of contacts.controls"
                :key="index"
                no-gutters
              >
                <v-text-field
                  v-model="item.value"
                  :label="`Contact ${index + 1}`"
                  :error-messages="item.errorsMessages"
                  append-outer-icon="mdi-close"
                  @click:append-outer="removeContact(index)"
                ></v-text-field>
              </v-row>
            </v-card-text>
          </v-card>
        </section>

        <br />
        <section class="cards">
          <v-card>
            <v-card-title class="card-title"
              ><span>Expenses</span>
              <span>${{ balance }}</span>
              <v-btn @click="addExpense" :disabled="balance < 1"
                >Add Expense</v-btn
              >
            </v-card-title>
            <v-card-text>
              <v-row
                v-for="(item, index) of expenses.controls"
                :key="index"
                no-gutters
              >
                <v-text-field
                  v-model="item.value"
                  :label="`Expense ${index + 1}`"
                  :error-messages="item.errorsMessages"
                  append-outer-icon="mdi-close"
                  @click:append-outer="removeExpense(index)"
                ></v-text-field>
              </v-row>
            </v-card-text>
          </v-card>
        </section>
      </v-form>
      <br />
      <div class="buttons cards">
        <v-btn @click="submit" color="primary">Submit</v-btn>
        <v-btn @click="myForm.markAllAsTouched()">Touch All</v-btn>
        <v-btn @click="contacts.markAllAsTouched()">Touch All contacts</v-btn>
        <v-btn @click="reset()">Reset All</v-btn>
      </div>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import {
  FormArray,
  FormControl,
  FormGroup,
  Validators,
} from "universal-reactive-forms";
import { AsyncCustomValidators } from "./AsyncValidator";
import { debounceTime, takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({})
export default class App extends Vue {
  unsubscriber$ = new Subject();
  myBudget = 399;

  switchValidation = new FormControl(true);

  myForm = new FormGroup({
    name: new FormControl(
      "",
      [Validators.required()],
      [AsyncCustomValidators.userValidator]
    ),
    age: new FormControl(null, [Validators.required()], undefined, {
      enabled: true,
      valueSetter: (value: any) => Number(value),
    }),
    contacts: new FormArray([
      new FormControl("5555-5555", [Validators.required()]),
    ]),
    /* Note that the initial expenses state is empty */
    expenses: new FormArray([]),
  });

  created() {
    /* expenses was started without a record, so in the 'created' method the first one is added. */
    this.addExpense();
    this.switchValidation.valueChanges.subscribe((v) => {
      if (v) {
        this.myForm.controls.name.setAsyncValidators([
          AsyncCustomValidators.userValidator,
        ]);
        this.myForm.controls.name.setValidators([Validators.required()]);
      } else {
        this.myForm.controls.name.setAsyncValidators([]);
        this.myForm.controls.name.setValidators([]);
      }
    });

    setTimeout(() => {
      this.myForm.controls.name.setAsyncValidators([
        AsyncCustomValidators.userValidator,
      ]);
    }, 5000);
  }

  reset() {
    this.switchValidation.reset();
    this.myForm.reset();
  }

  /* Each contact added when changed, automatically searches the others to see if there
  are no duplicate records (Except the first contact, as nothing has been defined
  to be executed when the value is changed). */
  addContactFied() {
    const control = new FormControl(null);
    control.setValidators([Validators.required()]);
    this.contacts.push(control);
    control.valueChanges
      .pipe(takeUntil(this.unsubscriber$), debounceTime(400))
      .subscribe((v) => {
        this.contacts.controls.forEach((item) => {
          if (
            item.id !== control.id &&
            !!control.value &&
            item.value == control.value
          ) {
            control.setErrors({ contactUsed: "Already exists" });
          }
        });
      });
  }

  addExpense() {
    const control = new FormControl(0, [Validators.required()], undefined, {
      enabled: true,
      valueSetter: (value: any) => Number(value),
    });
    this.expenses.push(control);
    control.valueChanges
      .pipe(takeUntil(this.unsubscriber$), debounceTime(400))
      .subscribe((v) => console.log("One More Time"));
  }

  removeExpense(index: number) {
    this.expenses.removeAt(index);
  }

  removeContact(index: number) {
    this.contacts.removeAt(index);
  }

  submit() {
    if (this.myForm.valid) {
      alert("Nice ! See the console");
      console.log(this.myForm.value);
    } else {
      this.myForm.markAllAsTouched();
      alert("Verify invalid fields");
    }
  }

  get contacts() {
    return this.myForm.controls.contacts as FormArray;
  }

  get expenses() {
    return this.myForm.controls.expenses as FormArray;
  }

  get balance() {
    return (
      this.myBudget -
      this.expenses.value.reduce<number>((acc, item) => {
        return acc + item;
      }, 0)
    );
  }

  destroyed() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
</script>

<style lang="scss">
.cards {
  width: 40%;
  margin: 0 auto;
}

.card-title {
  display: flex;
  justify-content: space-between;
}

.buttons {
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
