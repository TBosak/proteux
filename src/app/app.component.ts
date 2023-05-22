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
  data: any = [];
  hiddenColumns: any[] = [];
  hidden: boolean = true;
  findMenu: any = {};
  renameMenu: any = {};
  reorderMenu: any = {};
  filterGroup: any = {};
  findGroup: any = {};
  replaceGroup: any = {};
  renameGroup: any = {};
  reorderGroup: any = {};
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
      this.createFilterSubscription();
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
      this.exportCSVFile(nonHiddenColumns, type);
    }
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
      this.createFilterSubscription();
    }

    changeColumnIndex(column: string){
      const index = this.reorderGroup[column].value;
      this.data = [...this.response.data].map((row) => {
        const newRow: any = {};
        const order = [...Object.keys(row)];
        order.splice(index, 0, order.splice(order.indexOf(column), 1)[0]);
        for (const key of order) {
            newRow[key] = row[key];
        }
        return newRow;
      });
      this.setData();
    }

    convertToCSV(objArray: string) {
      var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
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

  exportCSVFile(items: Array<any>, type: string = 'csv') {
    items.unshift(Object.keys(items[0]));
    // Convert Object to JSON
    const jsonObject = JSON.stringify(items);
    const csv = this.convertToCSV(jsonObject);
    const exportedFilename = type === 'csv' ? 'export.csv' : 'export.txt';

    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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
    }

    setFormGroups(){
      Object.keys(this.response.data[0]).forEach((key: any) => {
        this.filterGroup[key]=this.filterGroup[key] ?? new FormControl('');
        this.findGroup[key]=this.findGroup[key] ?? new FormControl('');
        this.replaceGroup[key]=this.replaceGroup[key] ?? new FormControl('');
        this.renameGroup[key]=this.renameGroup[key] ?? new FormControl('');
        this.reorderGroup[key]=this.reorderGroup[key] ?? new FormControl('');
        this.findMenu[key]=this.findMenu[key] ?? false;
        this.renameMenu[key]=this.renameMenu[key] ?? false;
        this.reorderMenu[key]=this.reorderMenu[key] ?? false;
      });
    }

    createFilterSubscription(){
      this.setData();
      this.clearGroups();
      this.setFormGroups();
      this.filterSubscription?.unsubscribe();
      this.filterSubscription = new FormGroup(this.filterGroup).valueChanges.subscribe((data: any) => {
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
