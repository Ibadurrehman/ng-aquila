import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Component, Type, ViewChild, Directive } from '@angular/core';
import { NxFileUploaderComponent } from './file-uploader.component';
import { NxFileUploaderModule } from './file-uploader.module';
import { NxErrorModule, NxLabelModule } from '@aposin/ng-aquila/base';
import { NxIconModule } from '@aposin/ng-aquila/icon';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import * as axe from 'axe-core';
import { FileItem } from './file-uploader.model';
import { dispatchKeyboardEvent } from '../cdk-test-utils';
import { DOWN_ARROW, TAB, UP_ARROW } from '@angular/cdk/keycodes';
import { HttpClientModule } from '@angular/common/http';

@Directive()
abstract class FileUploaderTest {
  @ViewChild(NxFileUploaderComponent,  { static: false }) fileUploaderInstance: NxFileUploaderComponent;
  public form: FormGroup;
  public queueList: null | Array<FileItem>;
  public required: boolean = false;
  public multiple: boolean = false;
  public maxFileSize: number;
}

describe('NxFileUploaderComponent', () => {
  let fixture: ComponentFixture<FileUploaderTest>;
  let testInstance: FileUploaderTest;
  let fileUploaderInstance: NxFileUploaderComponent;
  let buttonElm: HTMLElement;
  let hintElement: HTMLElement;
  let inputElm: HTMLInputElement;
  let labelElm: HTMLInputElement;

  function createTestComponent(component: Type<FileUploaderTest>) {
    fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    testInstance = fixture.componentInstance;
    fileUploaderInstance = testInstance.fileUploaderInstance;
    buttonElm = fixture.nativeElement.querySelector('[nxFileUploadButton]');
    inputElm = fixture.nativeElement.querySelector('input[type=file]');
    hintElement = fixture.nativeElement.querySelector('[nxFileUploadHint]');
    labelElm = fixture.nativeElement.querySelector('nx-label');
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        BasicFileUpload,
        ReactiveFileUpload,
        DynamicFileUpload
      ],
      imports: [
        NxFileUploaderModule,
        NxLabelModule,
        NxIconModule,
        ReactiveFormsModule,
        FormsModule,
        NxErrorModule,
        HttpClientModule
      ]
    }).compileComponents();
  }));

  describe('basic', () => {
    it('should create', () => {
      createTestComponent(BasicFileUpload);
      expect(fileUploaderInstance).toBeTruthy();
    });

    it('should open the file browser when click on the button', () => {
      createTestComponent(BasicFileUpload);
      spyOn(inputElm, 'click').and.callThrough();
      buttonElm.click();

      expect(inputElm.click).toHaveBeenCalled();
    });
  });

  describe('Template-Driven Form', () => {
    it(
      'recognize and assign ngControl',
      fakeAsync(() => {
        createTestComponent(DynamicFileUpload);

        fixture.detectChanges();
        tick();

        expect(fileUploaderInstance.ngControl).toBeDefined();
      })
    );
  });

  describe('Reactive',  () => {
    it('should patch operations in reactive forms', () => {
      createTestComponent(ReactiveFileUpload);
      expect(testInstance.form.controls['documents'].value).toBeFalsy();

      let fakeFile = new File(['1'], 'fake file', { type: 'text/html' });
      fakeFile = Object.defineProperty(
        fakeFile, 'size', {value: 1024, writable: false});
      testInstance.form.patchValue({'documents': [new FileItem(fakeFile)]});
      fixture.detectChanges();

      expect(testInstance.form.controls['documents'].value).toBeTruthy();
    });

    it('should reflect the file list', () => {
      createTestComponent(ReactiveFileUpload);

      expect(fileUploaderInstance.value).toBeFalsy();
      expect(testInstance.form.controls['documents'].value).toBe(null);

      let fakeFile = new File(['1'], 'fake file', { type: 'text/html' });
      fakeFile = Object.defineProperty(
        fakeFile, 'size', {value: 1024, writable: false});
      testInstance.form.patchValue({'documents': [new FileItem(fakeFile)]});
      fixture.detectChanges();

      expect(testInstance.form.controls['documents'].value).toBeTruthy();
    });

    it('should set the control to dirty when value changes in the DOM', () => {
      createTestComponent(ReactiveFileUpload);

      expect(testInstance.form.get('documents').dirty)
      .toEqual(false, `Expected control to start out pristine.`);

      let fakeFile = new File(['1'], 'fake file', { type: 'text/html' });
      fakeFile = Object.defineProperty(
        fakeFile, 'size', {value: 0, writable: false});
      testInstance.form.setValue({documents: [new FileItem(fakeFile)]});
      testInstance.form.controls['documents'].markAsTouched();
      testInstance.form.markAsTouched();
      testInstance.form.markAsDirty();

      fixture.detectChanges();

      expect(testInstance.form.dirty)
      .toEqual(true, `Expected control to be dirty.`);
    });

    it('should programmatically set the files', () => {
      createTestComponent(ReactiveFileUpload);
      expect(testInstance.form.controls['documents'].value).toBe(null);

      let fakeFile = new File(['1'], 'fake file', { type: 'text/html' });
      fakeFile = Object.defineProperty(
        fakeFile, 'size', {value: 1024, writable: false});

      const fileList = {
        0: fakeFile,
        1: fakeFile,
        length: 2,
        item: (index: number) => fakeFile
      };

      fileUploaderInstance._onFileChange({
        type: 'change',
        target: {
          files: fileList
        }
      });
      fixture.detectChanges();

      expect(testInstance.form.controls['documents'].value.length).toBe(2);
      expect((<HTMLElement[]>fixture.nativeElement.querySelectorAll('.nx-file-uploader--file-row')).length).toBe(2);
    });
  });

  describe('Queue actions', () => {
    it('should delete file from the queue', () => {
      createTestComponent(ReactiveFileUpload);

      let fakeFile = new File(['1'], 'fake file', { type: 'text/html' });
      fakeFile = Object.defineProperty(
        fakeFile, 'size', {value: 1024, writable: false});
      const fileList = {
        0: fakeFile,
        1: fakeFile,
        length: 2,
        item: (index: number) => fakeFile
      };

      fileUploaderInstance._onFileChange({
        type: 'change',
        target: {
          files: fileList
        }
      });
      fixture.detectChanges();

      expect(testInstance.form.controls['documents'].value.length).toBe(2);

      const deleteAction = <HTMLElement>fixture.nativeElement.querySelector('.nx-file-uploader--file-row-actions button.nx-file-uploader--file-action-delete');
      deleteAction.click();
      fixture.detectChanges();

      expect(testInstance.form.controls['documents'].value.length).toBe(1);
    });

    it('should set file state from the form', fakeAsync(() => {}));
  });

  describe('Validation', () => {

      it('should be required', () => {
      createTestComponent(ReactiveFileUpload);
      const submitButton = <HTMLButtonElement>fixture.nativeElement.querySelector('#submit-button');
      testInstance.required = true;
      fixture.detectChanges();
      submitButton.click();
      fixture.detectChanges();

      expect(testInstance.form.valid).toBe(false);
      });

    it('should be invalid when all files are deleted from the queue', () => {
      createTestComponent(ReactiveFileUpload);
      fixture.detectChanges();
      let fakeFile = new File(['1'], 'fake file', { type: 'text/html' });
      fakeFile = Object.defineProperty(
        fakeFile, 'size', {value: 12, writable: false});
      const fileList = {
        0: fakeFile,
        length: 1,
        item: (index: number) => fakeFile
      };

      fileUploaderInstance._onFileChange({
        type: 'change',
        target: {
          files: fileList
        }
      });
      fixture.detectChanges();

      expect(testInstance.form.controls['documents'].value.length).toBe(1);

      const deleteAction = <HTMLElement>fixture.nativeElement.querySelector('.nx-file-uploader--file-row-actions button.nx-file-uploader--file-action-delete');
      deleteAction.click();
      fixture.detectChanges();

      expect(testInstance.form.controls['documents'].value.length).toBe(0);
      expect(testInstance.form.controls['documents'].hasError('required')).toBe(true);
    });

    it('should be error when selected file size is bigger than the max file', () => {
      createTestComponent(ReactiveFileUpload);
      testInstance.required = true;
      testInstance.maxFileSize = 1024;
      fixture.detectChanges();

      let fakeFile = new File(['3555'], 'fake file', { type: 'text/html' });
      fakeFile = Object.defineProperty(
        fakeFile, 'size', {value: Math.pow(1024, 3), writable: false});
      const fileList = {
        0: fakeFile,
        1: fakeFile,
        length: 2,
        item: (index: number) => fakeFile
      };

      fileUploaderInstance._onFileChange({
        type: 'change',
        target: {
          files: fileList
        }
      });
      fixture.detectChanges();

      expect(testInstance.form.controls['documents'].valid).toBe(false);
      expect(testInstance.form.controls['documents'].hasError('NxFileUploadMaxFileSize')).toBe(true);
      expect(testInstance.form.controls['documents'].hasError('required')).toBe(true);
    });
  });

  describe('keyboard support', () => {
    it('should move over the file list', fakeAsync(() => {
      createTestComponent(ReactiveFileUpload);

      let fakeFile = new File(['1'], 'fake file', { type: 'text/html' });
      fakeFile = Object.defineProperty(
          fakeFile, 'size', {value: 1024, writable: false});
      const fileList = {
        0: fakeFile,
        1: fakeFile,
        2: fakeFile,
        3: fakeFile,
        length: 4,
        item: (index: number) => fakeFile
      };

      fileUploaderInstance._onFileChange({
        type: 'change',
        target: {
          files: fileList
        }
      });
      fixture.detectChanges();
      const fileRowList = <HTMLElement[]>fixture.nativeElement.querySelectorAll('.nx-file-uploader--file-row');
      tick();
      fileRowList[0].focus();

      dispatchKeyboardEvent(fileRowList[0], 'keydown', DOWN_ARROW);
      expect(document.activeElement).toEqual(fileRowList[1]);

      dispatchKeyboardEvent(fileRowList[1], 'keydown', UP_ARROW);
      expect(document.activeElement).toEqual(fileRowList[0]);

      dispatchKeyboardEvent(fileRowList[0], 'keydown', TAB);
      expect(document.activeElement).toEqual(fileRowList[0]);
    }));
  });

  describe('a11y', () => {
    it('has no basic accessibility violations', function(done) {
      createTestComponent(BasicFileUpload);

      axe.run(fixture.nativeElement, {},  (error: Error, results: axe.AxeResults) => {
        expect(results.violations.length).toBe(0);
        const violationMessages = results.violations.map(item => item.description);
        done();
      });
    });

    it('should add aria described by for hint and label', fakeAsync(() => {
      createTestComponent(ReactiveFileUpload);
      tick();
      fixture.detectChanges();

      let ariaDescribedBy;
      ariaDescribedBy = buttonElm.attributes.getNamedItem('aria-describedby').value;
      tick();
      fixture.detectChanges();

      expect(ariaDescribedBy).toContain(hintElement.getAttribute('id'));
      expect(ariaDescribedBy).toContain(labelElm.getAttribute('id'));
    }));

    it('should set described by with the error ids',
        fakeAsync(() => {
          let ariaDescribedBy;

          createTestComponent(ReactiveFileUpload);
          const submitButton = <HTMLButtonElement>fixture.nativeElement.querySelector('#submit-button');
          testInstance.required = true;
          tick();
          fixture.detectChanges();
          submitButton.click();
          fixture.detectChanges();
          tick();

          ariaDescribedBy = buttonElm.attributes.getNamedItem('aria-describedby').value;
          expect(ariaDescribedBy).toContain(testInstance.fileUploaderInstance._errorList.map((error) => {
            return error.id;
          }));
        }));
  });
});

@Component({
  template: `
      <nx-file-uploader>
          <nx-label>Required file to upload</nx-label>
          <span nxFileUploadHint>All files are accepted</span>
          <button
                  nxButton="primary"
                  type="button"
                  nxFileUploadButton
          >
              <nx-icon name="download" class="nx-margin-right-2xs"></nx-icon>
              Add Files
          </button>
      </nx-file-uploader>
  `
})
class BasicFileUpload extends FileUploaderTest {
  public fb;

  constructor() {
    super();

    this.fb = new FormBuilder();

    this.form = this.fb.group({
      documents: []
    });
  }
}

@Component({
  template: `
      <form [formGroup]="form">
          <nx-file-uploader formControlName="documents"
                            [required]="required"
                            [maxFileSize]="maxFileSize"
                            multiple
          >
              <nx-label size="small">Required file to upload</nx-label>
              <span nxFileUploadHint>maximum Filesize 2MB</span>

              <button
                      nxButton="primary"
                      type="button"
                      nxFileUploadButton>
                  <nx-icon name="download" class="nx-margin-right-2xs"></nx-icon>
                  Add Files
              </button>

              <nx-error *ngIf="form.controls['documents'].hasError('required')">Required!</nx-error>
              <nx-error *ngIf="form.controls['documents'].hasError('NxFileUploadMaxFileSize')">
                  File „ {{form.controls['documents'].getError('NxFileUploadMaxFileSize').fileName | json}}“ can not be uploaded. File size exceeds size limit!
              </nx-error>
          </nx-file-uploader>

          <button nxButton="primary"
                  type="submit"
                  id="submit-button"
          >Upload files</button>
      </form>

  `
})
class ReactiveFileUpload extends FileUploaderTest {
  public fb;
  public required;
  public maxFileSize;
  public queueList;

  constructor() {
    super();

    this.fb = new FormBuilder();
    this.form = this.fb.group({
      documents: [this.queueList, Validators.required]
    });
  }
}

@Component({
  template: `
      <nx-file-uploader [(ngModel)]="queueList">
          <nx-label size="small">Please upload a file</nx-label>

          <button
                  nxButton="primary"
                  type="button"
                  nxFileUploadButton>
              <nx-icon name="download" class="nx-margin-right-2xs"></nx-icon>
              Add a file
          </button>
      </nx-file-uploader>
  `
})
class DynamicFileUpload extends FileUploaderTest {
  public queueList;
}
