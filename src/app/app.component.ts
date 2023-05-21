import { AfterViewChecked, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren, computed, signal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import * as Papa from 'papaparse';
import { MatTableExporterDirective } from 'mat-table-exporter';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatExpansionPanel } from '@angular/material/expansion';
import * as exportFromJSON from 'export-from-json'
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements  OnInit, AfterViewChecked {
  title = 'app';
  response = new MatTableDataSource<any>([{}]);
  data: any = [];
  hiddenColumns: any[] = [];
  hidden: boolean = true;
  findMenu: any = {};
  renameMenu: any = {};
  filterGroup: any = {};
  findGroup: any = {};
  replaceGroup: any = {};
  renameGroup: any = {};
  filterSubscription!: Subscription;
  myFormGroup!:FormGroup;
  @ViewChild(MatTableExporterDirective) matTableExporter!: MatTableExporterDirective;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChildren('panel') panels!: QueryList<MatExpansionPanel>;

  ngOnInit(): void {

  }

  ngAfterViewChecked(): void {
    if (!this.response.paginator) this.response.paginator = this.paginator;
  }

  clickFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  process(event: any){
    const target= event.target as HTMLInputElement;
    const file: File = (target.files as FileList)[0];
    file.text().then((text) => {
      if(file.type.includes('csv')){
        this.data = Papa.parse(text, {header:true, skipEmptyLines: true}).data;
      }
      if(file.type.includes('json')){
        this.data = JSON.parse(text);
      }
      this.setData();
      Object.keys(this.response.data[0]).forEach((key: any) => {
        this.filterGroup[key]=new FormControl('');
        this.findGroup[key]=new FormControl('');
        this.replaceGroup[key]=new FormControl('');
        this.renameGroup[key]=new FormControl('');
        this.findMenu[key]=false;
        this.renameMenu[key]=false;
      });
      this.myFormGroup = new FormGroup(this.filterGroup);
      this.filterSubscription?.unsubscribe();
      this.filterSubscription = this.myFormGroup.valueChanges.subscribe((data: any) => {
        this.response.data = [...this.data].filter((row: any) => {
          let match = true;
          Object.keys(data).forEach((key: any) => {
            if(data[key] !== ''){
              if(!row[key].includes(data[key])){
                match = false;
              }
            }
          });
          return match;
        });
      });
    });
  }

  setData(){
    const datasource = new MatTableDataSource<any>(this.data);
    datasource.paginator = this.paginator;
    this.response = datasource;
    this.hidden = false;
  }

  keys(obj: any){
    return Object.keys(obj);
  }

  export(type: any, opts:any = null){
    this.panels.forEach((panel) => {panel.close()});
    if(type == 'json'){
      const nonHiddenColumns = this.response.data.map((row) => {
        const newRow: any = {};
        Object.keys(row).forEach((key) => {
          if(!this.hiddenColumns.includes(Object.keys(row).indexOf(key))){
            newRow[key] = row[key];
          }
        });
        return newRow;
      });
      exportFromJSON.default({ data: nonHiddenColumns, fileName: 'export', exportType: type });
    }
    else{this.matTableExporter.exportTable(type, opts);}
    }

    hideColumn(event: any, index: any){
      if(event.checked){
        this.hiddenColumns.push(index);
      }
      else{
        this.hiddenColumns = this.hiddenColumns.filter((i) => i !== index);
      }
    }

    sort(column: string, dir: string){
      this.response.data = [...this.response.data].sort((a, b) => {
        if(dir === 'asc'){
          return a[column] > b[column] ? 1 : -1;
        }
        else{
          return a[column] < b[column] ? 1 : -1;
        }
      });
    }

    findAndReplace(column: string){
      this.response.data = [...this.response.data].map((row) => {
        row[column] = row[column].replaceAll(this.findGroup[column].value, this.replaceGroup[column].value);
        return row;
      });
    }

    renameColumn(column: string){
      const newColumn = this.renameGroup[column].value;
      if(Object.keys(this.response.data[0]).includes(newColumn)){
        alert('This column name already exists');
        return;
       }
      if(newColumn.trim() === ''){
        alert('Column name cannot be empty');
        return;
      }
        this.data = [...this.response.data].map((row) => {
        const newRow: any = {};

        for (const key of Object.keys(row)) {
          if (key === column) {
            newRow[newColumn] = row[key]; // Rename the property
          } else {
            newRow[key] = row[key];
          }
        }
        return newRow;
      });
        this.filterGroup[newColumn]=this.filterGroup[column];
        this.findGroup[newColumn]=this.findGroup[column];
        this.replaceGroup[newColumn]=this.replaceGroup[column];
        this.renameGroup[newColumn]=new FormControl('');
        this.findMenu[newColumn]=false;
        this.renameMenu[newColumn]=false;
      this.myFormGroup = new FormGroup(this.filterGroup);
      this.filterSubscription?.unsubscribe();
      this.setData();
      this.filterSubscription = this.myFormGroup.valueChanges.subscribe((data: any) => {
        this.response.data = [...this.data].filter((row: any) => {
          let match = true;
          Object.keys(data).forEach((key: any) => {
            if(data[key] !== ''){
              if(!row[key].includes(data[key])){
                match = false;
              }
            }
          });
          return match;
        });
      });
    }
}
