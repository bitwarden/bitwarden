import { Injectable, OnDestroy } from "@angular/core";
import { ActivatedRoute, NavigationExtras } from "@angular/router";
import { combineLatest, map, Observable, Subject, takeUntil } from "rxjs";

import { RoutedVaultFilterModel } from "./routed-vault-filter.model";

@Injectable()
export class RoutedVaultFilterService implements OnDestroy {
  private onDestroy = new Subject<void>();

  filter$: Observable<RoutedVaultFilterModel>;

  constructor(activatedRoute: ActivatedRoute) {
    this.filter$ = combineLatest([activatedRoute.paramMap, activatedRoute.queryParamMap]).pipe(
      map(([params, queryParams]) => {
        return {
          collectionId: queryParams.get("collectionId") ?? undefined,
          folderId: queryParams.get("folderId") ?? undefined,
          organizationId:
            queryParams.get("organizationId") ?? params.get("organizationId") ?? undefined,
          type: queryParams.get("type") ?? undefined,
        };
      }),
      takeUntil(this.onDestroy)
    );
  }

  createRoute(filter: RoutedVaultFilterModel): { commands: any[]; extras?: NavigationExtras } {
    return {
      commands: [],
      extras: {
        queryParams: {
          collectionId: filter.collectionId ?? null,
          folderId: filter.folderId ?? null,
          organizationId: filter.organizationId ?? null,
          type: filter.type ?? null,
        },
        queryParamsHandling: "merge",
      },
    };
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }
}
