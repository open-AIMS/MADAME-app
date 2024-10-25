import {
  Component,
  input,
  model,
  ModelSignal,
  OnInit,
  output,
  OutputRef,
} from '@angular/core';
import { MatSliderModule } from '@angular/material/slider';
import { combineLatest, delay, skip, switchMap } from 'rxjs';
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';

type EmittedValue = number | [number, number];

@Component({
  selector: 'app-time-slider',
  standalone: true,
  imports: [
    MatSliderModule,
    MatIconButton,
    MatIcon,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
  ],
  templateUrl: './time-slider.component.html',
  styleUrl: './time-slider.component.scss',
})
export class TimeSliderComponent implements OnInit {
  min = input.required<number>();
  max = input.required<number>();

  mode = model<'range' | 'point'>('range');

  // values set during ngOnInit
  left = model() as ModelSignal<number>;
  right = model() as ModelSignal<number>;

  leftChange = output<number>();
  rightChange = output<number>();

  // Note: toObservable replays
  private point$ = toObservable(this.left);

  private range$ = combineLatest([this.point$, toObservable(this.right)]);

  /**
   * Outputs [leftVal, rightVal] in range mode, single value otherwise.
   * OutputRef<number|Array<number>>
   */
  valueChange: OutputRef<EmittedValue> = outputFromObservable(
    toObservable(this.mode).pipe(
      delay(1),
      switchMap(mode => {
        if (mode === 'range') {
          if (this.right() < this.left()) {
            // it's a bit awkward when stacking them, so set to max
            this.right.set(this.max());
            // we just set right, prevent emitting old right value.
            return this.range$.pipe(skip(1));
          } else {
            return this.range$;
          }
        } else {
          return this.point$;
        }
      }),
      // initial input init shouldn't emit.
      skip(1)
    )
  );

  constructor() {}

  ngOnInit(): void {
    // ensure in bounds
    const left = this.left();
    const min = this.min();
    if (left === undefined || left < min) {
      this.left.set(min);
    }

    const right = this.right();
    const max = this.max();
    if (right === undefined || right > max) {
      this.right.set(max);
    }
  }
}
