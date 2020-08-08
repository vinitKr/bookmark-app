import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DashboardService } from '../shared/services/dashboard.service';
import { Folder, Bookmark, IBookmarkDialogData, IFolderResponse, IBookmarkResponse } from '../shared/models';
import { BookmarkDialogComponent } from '../shared/dialogs/bookmark-dialog/bookmark-dialog.component';
import { Observable, iif } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  folders: Folder[] = [];
  bookmarks: Bookmark[] = [];
  selectedFolder = '';
  showLocalDefault: boolean;
  searchText = '';

  constructor(
    private dashboardService: DashboardService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.getLatestData();
  }

  getLatestData(bookmarksOnly?: boolean) {
    return iif(() => bookmarksOnly, this.dashboardService.getBookmarksByFolderId(this.selectedFolder),
      this.dashboardService.getFolders().pipe(
        mergeMap((folder) => {
          this.folders = folder.data;
          const defaultFolder = this.folders.find(it => it.name === 'Default');
          if (defaultFolder) {
            this.showLocalDefault = false;
            // auto select remote default folder on load if exist
            this.selectedFolder = defaultFolder ? defaultFolder._id : '';
          } else {
            this.showLocalDefault = true;
          }
          return this.dashboardService.getBookmarksByFolderId(this.selectedFolder);
        })
      )
    ).subscribe(
      bookmark => {
        this.bookmarks = bookmark.data;
      }
    );
  }

  addBookmark() {
    const data: IBookmarkDialogData = { bookmark: new Bookmark(), folderList: this.folders };
    const dialogRef = this.dialog.open(BookmarkDialogComponent, { width: '500px', data });
    dialogRef.afterClosed().subscribe(
      (result: IBookmarkDialogData) => {
        if (result) {
          this.dashboardService.createBookmark(result.bookmark).subscribe(
            res => {
              this.getLatestData();
              this.snackBar.open(res.message, 'Done', { duration: 4000 });
            },
            err => {
              this.snackBar.open(err.message, 'Error', { duration: 4000 });
            }
          );
        }
      }
    );
  }

  onUpdateBookmark(bookmark: Bookmark) {
    const data: IBookmarkDialogData = { bookmark, folderList: this.folders };
    const dialogRef = this.dialog.open(BookmarkDialogComponent, { width: '500px', data });
    dialogRef.afterClosed().subscribe(
      (result: IBookmarkDialogData) => {
        if (result) {
          this.dashboardService.updateBookmark(result.bookmark).subscribe(
            res => {
              this.getLatestData();
              this.snackBar.open(res.message, 'Done', { duration: 4000 });
            },
            err => {
              this.snackBar.open(err.message, 'Error', { duration: 4000 });
            }
          );
        }
      }
    );
  }

  onDeleteBookmark(bookmark: Bookmark) {
    this.dashboardService.deleteBookmark(bookmark._id).subscribe(
      res => {
        this.getLatestData(true);
        this.snackBar.open(res.message, 'Done', { duration: 4000 });
      },
      err => {
        this.snackBar.open(err.message, 'Error', { duration: 4000 });
      }
    );
  }

  searchBookmark() {
    if (!this.searchText.length || this.searchText.length > 1) {
      this.dashboardService.searchBookmark(this.searchText).subscribe(
        res => {
          this.bookmarks = res.data;
        }
      );
    }
  }

}
