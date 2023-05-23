import { AfterViewChecked, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
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
  data: any = [{}];
  hiddenColumns: any[] = [];
  keys: any[] = [];
  hidden: boolean = true;
  findMenu: any = {};
  renameMenu: any = {};
  reorderMenu: any = {};
  lockDisabled: any = {};
  filterGroup: any = {};
  findGroup: any = {};
  replaceGroup: any = {};
  regexGroup: any = {};
  regexFilterGroup: any = {};
  renameGroup: any = {};
  reorderGroup: any = {};
  subscriptions: Subscription[] = [];
  filterFormGroup!:FormGroup;
  regexFormGroup!:FormGroup;
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
      this.keys=Object.keys(this.data[0]);
      this.createFilterSubscription();
    });
  }

  setData(){
    const datasource = new MatTableDataSource<any>(this.data);
    datasource.paginator = this.paginator;
    this.response = datasource;
    this.hidden = false;
  }

  export(type: any){
    this.panels.forEach((panel) => {panel.close()});
    const nonHiddenColumns = this.response.data.map((row) => {
      const newRow: any = {};
      Object.keys(row).forEach((key) => {
        if(!this.hiddenColumns.includes(Object.keys(row).indexOf(key))){
          newRow[key] = row[key];
        }
      });
      return newRow;
    });
    if(type == 'json'){
      exportFromJSON.default({ data: nonHiddenColumns, fileName: 'export', exportType: type });
    }
    if(type=='csv' || type=='txt'){
      const csv = this.convertToCSV(nonHiddenColumns);
      this.exportFile(csv, type);
    }
    if(type=='md'){
      var parser = require('json-to-markdown-table');
      const data = parser(nonHiddenColumns, Object.keys(nonHiddenColumns[0]));
      this.exportFile(data, type);
    }
    // if(type='xml'){

    //   var data = parser.toXml(nonHiddenColumns);
    //   this.exportFile(data, type);
    // }
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
        this.data = [...this.data].map((row) => {
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
      this.keys=Object.keys(this.data[0]);
      this.createFilterSubscription();
    }

    changeColumnIndex(column: string){
      const index = this.reorderGroup[column].value;
      this.data = [...this.data].map((row) => {
        const newRow: any = {};
        const order = [...Object.keys(row)];
        order.splice(index, 0, order.splice(order.indexOf(column), 1)[0]);
        for (const key of order) {
            newRow[key] = row[key];
        }
        return newRow;
      });
      this.keys=Object.keys(this.data[0]);
      this.setData();
    }

    convertToCSV(items: Array<any>) {
      items.unshift(Object.keys(items[0]));
      // Convert Object to JSON
      const jsonObject = JSON.stringify(items);
      var array = typeof jsonObject != 'object' ? JSON.parse(jsonObject) : jsonObject;
      var str = '';

      for (var i = 0; i < array.length; i++) {
          var line = '';
          for (var index in array[i]) {
              if (line != '') line += ','

              line += array[i][index];
          }

          str += line + '\r\n';
      }

      return str;
  }

    exportFile(data: any, type: string){
      const exportedFilename = 'export.' + type;
      var blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
          var link = document.createElement("a");
          if (link.download !== undefined) { // feature detection
              // Browsers that support HTML5 download attribute
              var url = URL.createObjectURL(blob);
              link.setAttribute("href", url);
              link.setAttribute("download", exportedFilename);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          }
    }

    clearGroups(){
      this.filterGroup = {};
      this.findGroup = {};
      this.replaceGroup = {};
      this.renameGroup = {};
      this.reorderGroup = {};
      this.regexGroup = {};
    }

    setFormGroups(){
      this.keys.forEach((key: any) => {
        this.filterGroup[key]=new FormControl('');
        this.findGroup[key]=new FormControl('');
        this.replaceGroup[key]=new FormControl('');
        this.renameGroup[key]=new FormControl('');
        this.reorderGroup[key]=new FormControl('');
        this.regexFilterGroup[key]=new FormControl('');
        this.findMenu[key]=false;
        this.renameMenu[key]=false;
        this.reorderMenu[key]=false;
        this.regexGroup[key]=false;
        this.lockDisabled[key]=true;
      });
    }

    createFilterSubscription() {
      this.setData();
      this.clearGroups();
      this.setFormGroups();

      this.subscriptions.forEach(sub => sub.unsubscribe());

      this.filterFormGroup = new FormGroup(this.filterGroup);
      this.subscriptions.push(
        this.filterFormGroup.valueChanges.subscribe(data => {
          this.response.data = this.filterData(data);
        })
      );

      this.regexFormGroup = new FormGroup(this.regexFilterGroup);
      this.subscriptions.push(
        this.regexFormGroup.valueChanges.subscribe(data => {
          this.response.data = this.filterData(data, true);
        })
      );

      this.lockDisabledSubscribe(this.filterGroup);
      this.lockDisabledSubscribe(this.regexFilterGroup);
    }

    filterData(data:any, useRegex = false) {
      return [...this.data].filter(row => {
        let match = true;
        Object.keys(data).forEach(key => {
          if (data[key] !== '') {
            if (useRegex) {
              const regex = new RegExp(data[key]);
              match = regex.test(row[key]);
            } else {
              if (!row[key].includes(data[key])) {
                match = false;
              }
            }
          }
        });
        return match;
      });
    }

    lockDisabledSubscribe(group:any) {
      Object.keys(group).forEach(key => {
        this.subscriptions.push(
          group[key].valueChanges.subscribe((value: any) => {
            this.lockDisabled[key] = !(/\S/.test(value));
          })
        );
      });
    }

    lockFilter(column: string){
      this.data = [...this.data].filter((row: any) => {
        const regex = new RegExp(this.regexFilterGroup[column].value);
        return this.regexGroup[column] ? regex.test(row[column]) : row[column].includes(this.filterGroup[column].value);
      });
      this.setData();
      this.filterGroup[column].value = '';
    }

    clearFilters(column: string){
      this.filterFormGroup.controls[column].setValue('');
      this.regexFormGroup.controls[column].setValue('');
    }
}
