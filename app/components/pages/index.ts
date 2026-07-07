import { bilingPagesEnum } from '~/services/models'
import MainPage from './MainPage.vue'
import ProfilePage from './ProfilePage.vue'
import UsersPage from './UsersPage.vue'
import BillingPage from './billingPage.vue'
import EventsPage from './EventsPage.vue'
import FieldsPage from './FieldsPage.vue'

export * from './MainPage.vue'
export * from './ProfilePage.vue'
export * from './UsersPage.vue'
export * from './billingPage.vue'
export * from './EventsPage.vue'
export * from './FieldsPage.vue'

export const pagesEnum = {
  [bilingPagesEnum.Main]: MainPage,
  [bilingPagesEnum.Profile]: ProfilePage,
  [bilingPagesEnum.Users]: UsersPage,
  [bilingPagesEnum.Billing]: BillingPage,
  [bilingPagesEnum.Events]: EventsPage,
  [bilingPagesEnum.Fields]: FieldsPage
}
