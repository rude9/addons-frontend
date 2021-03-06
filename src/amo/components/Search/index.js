import deepEqual from 'deep-eql';
import PropTypes from 'prop-types';
import React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { setViewContext } from 'amo/actions/viewContext';
import Link from 'amo/components/Link';
import SearchContextCard from 'amo/components/SearchContextCard';
import SearchFilters from 'amo/components/SearchFilters';
import SearchResults from 'amo/components/SearchResults';
import { searchStart } from 'core/actions/search';
import Paginate from 'core/components/Paginate';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_TRENDING,
  SEARCH_SORT_TOP_RATED,
  SEARCH_SORT_POPULAR,
  VIEW_CONTEXT_EXPLORE,
} from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import {
  convertFiltersToQueryParams,
  hasSearchFilters,
} from 'core/searchUtils';
import { parsePage } from 'core/utils';

import './styles.scss';


export class SearchBase extends React.Component {
  static propTypes = {
    LinkComponent: PropTypes.node.isRequired,
    count: PropTypes.number,
    dispatch: PropTypes.func.isRequired,
    enableSearchFilters: PropTypes.bool,
    errorHandler: PropTypes.object.isRequired,
    filters: PropTypes.object,
    filtersUsedForResults: PropTypes.object,
    i18n: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    paginationQueryParams: PropTypes.object,
    pathname: PropTypes.string,
    results: PropTypes.array,
  }

  static defaultProps = {
    LinkComponent: Link,
    count: 0,
    enableSearchFilters: true,
    filters: {},
    filtersUsedForResults: {},
    paginationQueryParams: null,
    pathname: '/search/',
    results: [],
  }

  componentWillMount() {
    this.dispatchSearch({
      newFilters: this.props.filters,
      oldFilters: this.props.filtersUsedForResults,
    });
  }

  componentWillReceiveProps({ filters }) {
    this.dispatchSearch({
      newFilters: filters,
      oldFilters: this.props.filters,
    });
  }

  dispatchSearch({ newFilters = {}, oldFilters = {} } = {}) {
    const { dispatch, errorHandler } = this.props;

    if (hasSearchFilters(newFilters) && !deepEqual(oldFilters, newFilters)) {
      dispatch(searchStart({
        errorHandlerId: errorHandler.id,
        filters: newFilters,
      }));

      const { addonType } = newFilters;
      if (addonType) {
        dispatch(setViewContext(addonType));
      } else {
        dispatch(setViewContext(VIEW_CONTEXT_EXPLORE));
      }
    }
  }

  renderHelmetTitle() {
    const { i18n, filters } = this.props;

    let title = i18n.gettext('Search results');

    if (filters.featured) {
      switch (filters.addonType) {
        case ADDON_TYPE_EXTENSION:
          title = i18n.gettext('Featured extensions');
          break;
        case ADDON_TYPE_THEME:
          title = i18n.gettext('Featured themes');
          break;
        default:
          title = i18n.gettext('Featured add-ons');
      }
    } else if (filters.sort) {
      switch (filters.sort) {
        case SEARCH_SORT_TRENDING:
          switch (filters.addonType) {
            case ADDON_TYPE_EXTENSION:
              title = i18n.gettext('Trending extensions');
              break;
            case ADDON_TYPE_THEME:
              title = i18n.gettext('Trending themes');
              break;
            default:
              title = i18n.gettext('Trending add-ons');
          }
          break;
        case SEARCH_SORT_TOP_RATED:
          switch (filters.addonType) {
            case ADDON_TYPE_EXTENSION:
              title = i18n.gettext('Top rated extensions');
              break;
            case ADDON_TYPE_THEME:
              title = i18n.gettext('Top rated themes');
              break;
            default:
              title = i18n.gettext('Top rated add-ons');
          }
          break;
        case SEARCH_SORT_POPULAR:
          switch (filters.addonType) {
            case ADDON_TYPE_EXTENSION:
              title = i18n.gettext('Popular extensions');
              break;
            case ADDON_TYPE_THEME:
              title = i18n.gettext('Popular themes');
              break;
            default:
              title = i18n.gettext('Popular add-ons');
          }
          break;
        default:
      }
    } else if (filters.query) {
      title = i18n.sprintf(
        i18n.gettext('Search results for "%(query)s"'),
        { query: filters.query }
      );
    }

    return (
      <Helmet>
        <title>{title}</title>
      </Helmet>
    );
  }

  render() {
    const {
      LinkComponent,
      count,
      enableSearchFilters,
      errorHandler,
      filters,
      loading,
      paginationQueryParams,
      pathname,
      results,
    } = this.props;

    const page = parsePage(filters.page);

    // We allow specific paginationQueryParams instead of always using
    // convertFiltersToQueryParams(filters) so certain search filters
    // aren't repeated if they are elsewhere in the URL. This is useful
    // for pages like the category page which contain `addonType` and
    // `category` in their URLs
    // (eg: `/extensions/categories/feed-news-blogging/`) so they don't
    // need them in the queryParams.
    //
    // If paginator params aren't specified, we fallback to filters.
    const queryParams = paginationQueryParams ||
      convertFiltersToQueryParams(filters);

    const paginator = count > 0 ? (
      <Paginate
        LinkComponent={LinkComponent}
        count={count}
        currentPage={page}
        pathname={pathname}
        queryParams={queryParams}
      />
    ) : null;

    return (
      <div className="Search">
        {this.renderHelmetTitle()}

        {errorHandler.renderErrorIfPresent()}

        <SearchContextCard />

        {enableSearchFilters ? (
          <SearchFilters filters={filters} pathname={pathname} />
        ) : null}

        <SearchResults
          count={count}
          filters={filters}
          loading={loading}
          pathname={pathname}
          results={results}
        />

        {paginator}
      </div>
    );
  }
}

export function mapStateToProps(state) {
  return {
    count: state.search.count,
    filtersUsedForResults: state.search.filters,
    loading: state.search.loading,
    results: state.search.results,
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'Search' }),
)(SearchBase);
