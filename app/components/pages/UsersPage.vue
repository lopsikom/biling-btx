<script setup lang="ts">
import UserIcon from '@bitrix24/b24icons-vue/common-b24/UserIcon'
import SearchIcon from '@bitrix24/b24icons-vue/outline/SearchIcon'
import { SelectItem } from 'reka-ui'
import { Icon } from '@iconify/vue'

const RoleItems = ref<string[]>(['Все роли', 'Администратор', 'Сотрудник', 'Менеджер'])
const RoleMenuValue = ref<string>('Все роли')

const Users = ref([{
    name : 'Иванов Иван',
    email : 'ivanov@yandex.ru',
    role : 'Администратор',
    status : 'active',
    date : '03.11.2025 14:30'
},
{
    name : 'Петрова Мария',
    email : 'petrova@technosfera.ru',
    role : 'Менеджер',
    status : 'active',
    date : '03.11.2026 14:30'
}])

const search = ref<string>()

</script>
<template>
    <div class="flex flex-col">
        <div class="any-white-container px-5 py-4 flex flex-col">
            <div class="flex">
                <div class="flex flex-col gap-1">
                    <span class="select-none font-semibold">Пользователи и доступы</span>
                    <span class="text-gray-500">Управление пользователями организации</span>
                </div>
                <div class="add-user-btn items-center flex px-2 py-2 gap-1">
                    <UserIcon class="w-6 h-6 text-slate-50" />
                    <span class="select-none text-sm text-slate-50 font-semibold">Добавить пользователя</span>
                </div>
            </div>
            <div class="flex flex-col">
                <div class="flex mt-5 gap-5">
                    <div class="search-box flex gap-3">
                        <SearchIcon class="w-5.5 h-5.5 text-gray-400" />
                        <textarea type="text" v-model="search" rows="1" placeholder="Поиск по имени или email..." class="search-input text-sm"></textarea>
                    </div>
                    
                    <div class="flex">
                        <SelectRoot v-model="RoleMenuValue">
                        <SelectTrigger class="select-menu text-gray-600 text-sm" >
                            <SelectValue />
                            <Icon icon="radix-icons:chevron-down" style="margin-left: auto;"/>
                        </SelectTrigger>
                        <SelectContent  :side-offset="2" class="p-[5px]" style="background:  white; border-color: #e7eaee; border-width: 1.5px; border-radius: 10px;" position="popper">
                                <SelectViewport>
                                    <SelectItem v-for="(value, index) in RoleItems" :key="index" :value="value" class="select-item">
                                        <SelectItemText class="text-gray-700 select-title">{{ value }}</SelectItemText>
                                        <SelectItemIndicator style="margin-left: auto; ">
                                            <Icon icon="radix-icons:check" class="text-gray-600"/>
                                        </SelectItemIndicator>
                                    </SelectItem>
                                </SelectViewport>
                            </SelectContent>
                    </SelectRoot>
                    </div>
                    <div class="flex">
                        <SelectRoot v-model="RoleMenuValue">
                        <SelectTrigger class="select-menu text-gray-600 text-sm" >
                            <SelectValue />
                            <Icon icon="radix-icons:chevron-down" style="margin-left: auto;"/>
                        </SelectTrigger>
                        <SelectContent  :side-offset="2" class="p-[5px]" style="background:  white; border-color: #e7eaee; border-width: 1.5px; border-radius: 10px;" position="popper">
                                <SelectViewport>
                                    <SelectItem v-for="(value, index) in RoleItems" :key="index" :value="value" class="select-item">
                                        <SelectItemText class="text-gray-700 select-title">{{ value }}</SelectItemText>
                                        <SelectItemIndicator style="margin-left: auto; ">
                                            <Icon icon="radix-icons:check" class="text-gray-600"/>
                                        </SelectItemIndicator>
                                    </SelectItem>
                                </SelectViewport>
                            </SelectContent>
                    </SelectRoot>
                    </div>
                </div> 
                <div class="flex mt-[15px] gap-5">
                    <div class="flex">
                        <SelectRoot v-model="RoleMenuValue">
                        <SelectTrigger class="select-menu text-gray-600 text-sm" >
                            <SelectValue />
                            <Icon icon="radix-icons:chevron-down" style="margin-left: auto;"/>
                        </SelectTrigger>
                        <SelectContent  :side-offset="2" class="p-[5px]" style="background:  white; border-color: #e7eaee; border-width: 1.5px; border-radius: 10px;" position="popper">
                                <SelectViewport>
                                    <SelectItem v-for="(value, index) in RoleItems" :key="index" :value="value" class="select-item">
                                        <SelectItemText class="text-gray-700 select-title">{{ value }}</SelectItemText>
                                        <SelectItemIndicator style="margin-left: auto; ">
                                            <Icon icon="radix-icons:check" class="text-gray-600"/>
                                        </SelectItemIndicator>
                                    </SelectItem>
                                </SelectViewport>
                            </SelectContent>
                    </SelectRoot>
                    </div>
                    <div class="flex">
                        <SelectRoot v-model="RoleMenuValue">
                        <SelectTrigger class="select-menu text-gray-600 text-sm" >
                            <SelectValue />
                            <Icon icon="radix-icons:chevron-down" style="margin-left: auto;"/>
                        </SelectTrigger>
                        <SelectContent  :side-offset="2" class="p-[5px]" style="background:  white; border-color: #e7eaee; border-width: 1.5px; border-radius: 10px;" position="popper">
                                <SelectViewport>
                                    <SelectItem v-for="(value, index) in RoleItems" :key="index" :value="value" class="select-item">
                                        <SelectItemText class="text-gray-700 select-title">{{ value }}</SelectItemText>
                                        <SelectItemIndicator style="margin-left: auto; ">
                                            <Icon icon="radix-icons:check" class="text-gray-600"/>
                                        </SelectItemIndicator>
                                    </SelectItem>
                                </SelectViewport>
                            </SelectContent>
                    </SelectRoot>
                    </div>

                </div>
                    <div class="users-list-grid mt-[30px]">
                        <div class="users-list-row" style="border-width: 0;">
                            <div class="font-semibold">Имя</div>
                            <div class="font-semibold">Email</div>
                            <div class="font-semibold">Роль</div>
                            <div class="font-semibold">Статус</div>
                            <div class="font-semibold">Дата последнего посещения</div>
                        </div>
                        <div class="users-list-row users-item" v-for="(value, index) in Users" :key="index">
                            <div>{{ value.name }}</div>
                            <div>{{ value.email }}</div>
                            <div>
                                <div class="any-white-container role-box px-[10px] py-[2px] flex justify-center align-center text-sm" style="width: fit-content;" >{{ value.role }}</div>
                            </div>
                            <div>
                                <div class="status-box text-slate-50 text-sm">{{ value.status }}</div>
                            </div>
                            <div>{{ value.date }}</div>
                        </div>
                    </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
    @import '~/assets/css/any-container.css';
    
.add-user-btn{
    background: #3182ce;
    border-radius: 10px;
    margin-left: auto;
    height: fit-content;

}
.add-user-btn:hover{
    background: #5899d7;
    transition: background 0.15s ease;
}

.select-menu{
    display: inline-flex;
    align-items: center;
    padding: 5px 15px;
    background-color: #edf2f7;
    border-radius: 5px;
    border: 1px solid rgba(255, 0, 0, 0);
    width: 200px;
}
.select-menu:focus{
    outline: none;
}

.select-content{
    overflow: hidden;
    background: white;
    border-radius: 6px;

}
.select-item{
    font-size: 13px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    height: 30px;
    min-width: 190px;
    padding: 0 10px 0 10px;
    position: relative;
    user-select: none;
}
.select-item[data-highlighted]{
    outline: none;
    background-color: #ebf8ff;
    transition: background-color 0.05s ease;
}
.select-item[data-highlighted] .select-title{
    color: #437db4;
    transition: color 0.05s ease;
}
.search-box{
    padding: 7px 10px;
    background-color: #edf2f7;
    border-radius: 5px;
    border: 1px solid rgba(255, 0, 0, 0);
    width: 60%;
    align-items: center;
}
.search-input{
    resize: none;
    width: 100%;
    outline: none;
}

.search-box:focus-within{
    border-color: #9bc6e8b1;
    box-shadow: 0 0 8px rgba(158, 203, 238);
    transition: border-color 0.15s ease;
    transition: box-shadow 0.15s ease;
}
.users-list-grid{
    display: grid;
    grid-auto-rows: auto;
    width: 100%;
}
.users-list-row{
    display: grid;
    grid-template-columns: repeat(5, minmax(max-content, 1fr));
    gap: 10px;
    border-top: 1px solid #d1d5db;
    padding: 10px 0px 10px 0px;
}
.status-box{
    align-self: center;
    align-items: center;
    justify-content: center;
    display: flex;
    flex-direction: row;
    background-color: #3989d1;
    padding: 2px 8px;
    height: 22px;
    gap: 3px;
    border-radius: 5px;
    width: fit-content;
}
.users-item:hover{
    background-color: #ebf8ff;
    cursor: pointer;
    transition: background-color 0.3s ease;
}
.users-item:hover .role-box{
    background-color: #ebf8ff;
    cursor: pointer;
    transition: background-color 0.3s ease;
}
</style>