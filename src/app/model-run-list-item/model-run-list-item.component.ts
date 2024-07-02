import { Component, Input } from '@angular/core';
import { ModelRun } from '../../types/model-run.type';

@Component({
  selector: 'app-model-run-list-item',
  standalone: true,
  imports: [],
  templateUrl: './model-run-list-item.component.html',
  styleUrl: './model-run-list-item.component.scss'
})
export class ModelRunListItemComponent {
  @Input({required: true}) run!: ModelRun;
}
