import { Observable, of } from "rxjs";
import { debounceTime, filter, first, map, switchMap } from "rxjs/operators";
import { fromFetch } from "rxjs/fetch";

export class AsyncCustomValidators {
  static userValidator = () => (source$: Observable<string>) =>
    source$.pipe(
      debounceTime(500),
      switchMap((value) => {
        return fromFetch(`https://jsonplaceholder.typicode.com/users`).pipe(
          first(),
          switchMap((response) => {
            if (response.ok) {
              // OK return data
              return response.json();
            } else {
              // Server is returning a status requiring the client to try something else.
              return of({ error: true, message: `Error ${response.status}` });
            }
          }),
          map((res) => {
            for (const item of res) {
              if (item.name.includes(value))
                return { hasUser: "please type another user" };
            }
            return null;
          })
        );
      })
    );
}
