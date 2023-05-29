import { Component, Input } from '@angular/core';
import { TreeItem, TreeItemChild } from 'src/app/util/types';
import { HistoryStateService } from '../../history/history-state.service';

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.css']
})
export class TreeViewComponent {
  @Input('loadingAttribute') loadingAttribute = false
  @Input('dataAttribute') dataAttribute: TreeItem[] = []
  @Input('dataLabel') dataLabel: string = 'items'
  
  onParentSelect (parent: TreeItem, event: Event) {
    const target = (event.target as HTMLInputElement)
    parent.children?.forEach(child => {
      child.selected = target.checked
    })
    parent.selected = target.checked ? 'all' : 'no'
  }

  onChildSelect (child: TreeItemChild, parent: TreeItem) {
    child.selected = !child.selected
    const childrenValues = parent.children?.map(c => c.selected)
    if (childrenValues?.every(v => v)) {
      parent.selected = 'all'
    } else if (childrenValues?.every(v => !v)) {
      parent.selected = 'no'
    } else { 
      parent.selected = 'some'
    }
  }

  getParentCount (parent: TreeItem) {
    if (!parent.children?.length) return 0
    return parent.children
      .reduce((previousValue, currentValue) => {
        return previousValue + currentValue.count
      }, 0)
  }

  constructor (public historyState: HistoryStateService) { }
}
