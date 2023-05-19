import { AfterViewChecked, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren, computed, signal } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import * as Papa from 'papaparse';
import { MatTableExporterDirective } from 'mat-table-exporter';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatExpansionPanel } from '@angular/material/expansion';

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
  group: any = {};
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
      const datasource = new MatTableDataSource<any>(this.data);
      datasource.paginator = this.paginator;
      this.response = datasource;
      this.hidden = false;
      Object.keys(this.response.data[0]).forEach((key: any) => {
        this.group[key]=new FormControl('');
      });
      this.myFormGroup = new FormGroup(this.group);

      this.myFormGroup.valueChanges.subscribe((data: any) => {
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

  keys(obj: any){
    return Object.keys(obj);
  }

  export(type: any, opts:any = null){
    this.panels.forEach((panel) => {panel.close()});
    setTimeout(()=>this.matTableExporter.exportTable(type, opts), 500);
    }

    hideColumn(event: any, index: any, column: any){
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

}
