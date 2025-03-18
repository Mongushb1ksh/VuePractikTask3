let eventBus = new Vue()

Vue.component('card-form', {

    template:`
        <form class="card" @submit.prevent="onSubmit">
            <h3>Новая задача</h3>
            <input v-model="card.title" placeholder="Заголовок" required>
            <textarea v-model="card.description" placeholder="Описание" required></textarea>
            <input type="date" v-model="card.deadline" required>
            <button type="submit">Создать</button>
        </form>
    `,

    data(){
        return{
            card: {
                title: '',
                description: '',
                deadline: '',
            }
        }
    },

    methods:{
        onSubmit(){
            const newCard = { 
                id: Date.now(),               
                title: this.card.title,
                description: this.card.description,
                deadline: this.card.deadline,
                createdAt: new Date().toLocaleString(),
                update: new Date().toLocaleString(),
            };
            this.$emit('add-card', newCard);
            this.card = { title: '', description: '', deadline: '' };
        }
    },
})


Vue.component('task-card', {
    props: {
        card: {
            type: Object,
            required: true,
        },
    },
    template:`
        <div class="card">
            <h3>{{ card.title }}</h3>
            <p>{{ card.description }}</p>
            <div>Создано: {{ card.createdAt }}</div>
            <div>Дедлайн:{{ formatDate(card.deadline) }}</div>
            <button @click="$emit('move-card')">Переместить</button>
            <button @click="$emit('delete-card')">Удалить</button>
        </div>
    `,
    methods: {
        formatDate(date){
            return new Date(date).toLocaleDateString();
        },
    },
})




let app = new Vue({
    el: '#app',
    data: {
            columns: [
                { title: 'Запланированные задачи', cards: [] },
                { title: 'Задачи в работе', cards: [] },
                { title: 'Тестирование', cards: [] },
                { title: 'Выполненные задачи', cards: [] },

            ],
    },

    methods:{
        addCard(newCard){
        if(!Array.isArray(this.columns[0].cards)){
            this.$set(this.columns[0], 'cards', []);
        }
            this.columns[0].cards.push(newCard);
            this.saveData();
        },
        moveCard(fromColumn, card){
            const toColumn = fromColumn + 1;
            this.columns[fromColumn].cards = this.columns[fromColumn].cards.filter(a => a.id !== card.id);
            this.columns[toColumn].cards.push(card);
            this.saveData();
        },
        deleteCard(card){
            this.columns.forEach(column => {
                const index = column.cards.findIndex(c => c.id === card.id)
                if(index !== -1){
                    column.cards.splice(index, 1);
                    this.saveData();
                }
            })
            
        },

        saveData(){
            localStorage.setItem('notesApp', JSON.stringify(this.columns));
        },
        loadData(){
            const savedData = localStorage.getItem('notesApp');
            if(savedData){
                const parsedData = JSON.parse(savedData);
                parsedData.forEach((columnData, index) => {
                    if(Array.isArray(columnData.cards)){
                        this.$set(this.columns[index], 'cards', columnData.cards)
                    }
                })
            };
            this.saveData();
        },

    },

    created() {
        this.loadData();
    },

});