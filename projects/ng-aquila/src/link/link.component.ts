import { NxIconComponent } from '@aposin/ng-aquila/icon';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ElementRef,
  Renderer2,
  Input,
  ChangeDetectorRef
} from '@angular/core';

import { MappedStyles } from '@aposin/ng-aquila/core';

/** The size of the link. */
export type NxLinkSize = 'small' | 'large';

const MAPPING = {
  'black': 'nx-link--black',
  'negative': 'nx-link--negative',
  'text': 'nx-link--text',
  'icon-right': 'nx-link--icon-right'
};

const DEFAULT_CLASSES = [ 'nx-link' ];

@Component({
  selector: 'nx-link',
  styleUrls: [ './link.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  inputs: ['classNames: nxStyle'],
  host: {
    '[class.nx-link--small]': 'this.size === "small"',
    '[class.nx-link--large]': 'this.size === "large"'
  }
})

export class NxLinkComponent extends MappedStyles implements AfterContentInit {
  private _size: NxLinkSize = 'small';

  /** @docs-private */
  @ContentChild(NxIconComponent) icon: NxIconComponent;

  /**
   * Sets the style of the link, thereby altering the visual appearance.
   *
   * You can use any combination of 'black', 'icon-right', 'negative' or 'text'
   */
  classNames;

  /** Sets the size of the link. Default: 'small'. */
  @Input()
  set size(value: NxLinkSize) {
    if (this._size !== value) {
      this._size = value;
      this._changeDetectorRef.markForCheck();
    }
  }
  get size(): NxLinkSize {
    return this._size;
  }

  constructor(_elementRef: ElementRef,
              protected _renderer: Renderer2,
              private _changeDetectorRef: ChangeDetectorRef) {

    super(MAPPING, DEFAULT_CLASSES, _elementRef, _renderer);
  }

  ngAfterContentInit() {
    // Add a specific link class that the css gets more specific than the nx-icon css
    const icons = this.elementRef.nativeElement.querySelectorAll('nx-icon');
    for (let i = 0; i < icons.length; i++) {
      this._renderer.addClass(icons[i], 'nx-link__icon');
    }
  }

  /**
   * @docs-private
   * getter used for the modal component as a quickfix
   * since button got changed from directive to component the reference used by the ngOpenModelOnClick directive
   * for nxButtons is a reference to component instance instead of an element reference. As a workaround we need a
   * way to reach the elementRef of the component until the modal gets refactored.
   */
  get elementRef() {
    return this._elementRef;
  }
}
