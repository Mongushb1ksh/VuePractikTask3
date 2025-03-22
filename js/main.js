let eventBus = new Vue()


Vue.component('trash-bin', {
    props: {
        showTrash: {
            type: Boolean,
            required: true
        },
        deletedCards: {
            type: Array,
            required: true,
        },
        columns: {
            type: Array,
            required: true,
        },
    },

    template: `
        <div class="trash-modal" v-if="showTrash" >
            <div class="modal-content">
                <h3>Корзина</h3>
                <div v-for="card in deletedCards" :key="card.id" class="trash-item">
                    <h4>{{ card.title }}</h4>
                    <select v-model="restoreTarget">
                        <option value="">Выберите колонку</option>
                        <option v-for="(col, index) in availableColumns"
                                :key="index"
                                :value="index">
                                {{col.title}}
                                </option>
                    </select>
                    <button @click="restore(card)">Восстановить</button>
                </div>
                <button @click="$emit('close')">Закрыть</button>
            </div>
        </div>
    `,


    data(){
        return{
            restoreTarget: null,
        }
    },

    computed:{
        availableColumns(){
            return this.columns
                .filter(col => col.title !== 'Выполненные задачи')
                .map((col, index) => ({ index, ...col }));
        }
    },

    methods:{
        restore(card){
            this.$emit('restore', card, this.restoreTarget);
            this.restoreTarget = null;
        }
    },

})


Vue.component('card-form', {
    props: {
        initialCard: {
            type: Object,
            required: false,
        }
    },

    template:`
        <form class="card" @submit.prevent="onSubmit">
            <h3>{{ isEditing ? 'Редактировать' : 'Новая задача'}}</h3>
            <input v-model="card.title" placeholder="Заголовок" required>
            <textarea v-model="card.description" placeholder="Описание" required></textarea>
            <label for="dealine">Дедлайн</label>
            <input type="date" id="deadline" v-model="card.deadline" required>
            <select v-model="card.priority" required>
                <option value="1">Высокий</option>
                <option value="2">Средний</option>
                <option value="3">Низкий</option>
            </select>
            <button type="submit">{{isEditing ? 'Сохранить' : 'Создать'}}</button>
            <button type="button" @click="$emit('close')">Отмена</button>
        </form>
    `,

    data(){
        return{
            card: {
                title: '',
                description: '',
                deadline: '',
                priority: '1',
            }
        }
    },
    computed: {
        isEditing(){
            return !!this.initialCard;
        }
    },

    methods:{
        resetForm(){
            this.card = { title: '', description: '', deadline: '' }; 
        },

        onSubmit(){
            const newCard = { 
                id: this.initialCard ? this.initialCard.id : Date.now(),              
                title: this.card.title,
                description: this.card.description,
                deadline: this.card.deadline,
                priority: this.card.priority,
                createdAt: this.initialCard ? this.initialCard.createdAt : new Date().toLocaleString(),
                editAt:  this.initialCard ? new Date().toLocaleString() : '',
                updateAt: new Date().toLocaleString(),
                returnReason: ''
            };
            this.$emit(this.initialCard ? 'save-card' : 'add-card', newCard);
            this.resetForm();
            this.$emit('close')
        }
    },
    created(){
        if(this.initialCard){
            this.card = {...this.initialCard}
        }
    },
})


Vue.component('task-card', {
    props: {
        card: {
            type: Object,
            required: true,
        },
        columnIndex: {
            type: Number,
            required: true,
        },
    },
    template:`
        <div class="card">
            <h3>{{ card.title }}</h3>
            <p>{{ card.description }}</p>
            <div>Создано: {{ card.createdAt }}</div>
            <div>Дедлайн:{{ formatDate(card.deadline) }}</div>
            <div v-if="card.editAt">Последнее редактирование: {{ card.editAt }}</div>
            <div v-if="card.completedAt">Завершено: {{ card.completedAt }}</div>
            <div v-if="card.returnReason">Причина возврата: {{ card.returnReason }}</div>
            <div v-if="columnIndex === 2">
                <button @click="showReturnForm = true">На исправления</button>
                <div v-if="showReturnForm" class="return-form">
                    <input v-model="returnReason" placeholder="Причина возврата" required>
                    <button @click="handleReturn">Потвердить</button>
                </div>
            </div>
            <div>
                <div class="priority">Приоритет: 
                    {{ getPriorityText(card.priority) }}
                </div>
            </div>

            <strong v-if="columnIndex === 3 && !card.overdue">Выполнено в срок</strong>
            <strong v-if="columnIndex === 3 && card.overdue">Просрочено</strong>

            <button v-if="columnIndex < 3" @click="$emit('move-card')">Переместить</button>
            <button v-if="columnIndex < 3" @click="$emit('edit-card')">Редактировать</button>
            <button v-if="columnIndex === 0" @click="$emit('delete-card', card, columnIndex)">Удалить</button>
        </div>
    `,
    data(){
        return{
            showReturnForm: false,
            returnReason: '',
        }
    },
    methods: {
        getPriorityText(priority){
            return{
                "1": "Высокий",
                "2": "Средний",
                "3": "Низкий",
            }[priority] || 'Нет';
        },


        formatDate(date){
            return new Date(date).toLocaleDateString();
        },

        handleReturn(){
            if(!this.returnReason.trim()) return;
            this.$emit('card-return', this.card, this.returnReason);
            this.showReturnForm = false;
            this.returnReason = '';
        }
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
            editingCard: null,
            editingCardColumn: null,
            showModal: false,
            deletedCards: [],
            showTrash: false,
    },


    computed:{
        sortedColumns(){
            return this.columns.map(column => ({
                ...column,
                cards:[...column.cards].sort((a, b) => a.priority - b.priority)
            }))
        }
    },

    methods:{
        
        deleteCard(card, columnIndex){
            const column = this.columns[columnIndex];
            const index = column.cards.findIndex(c => c.id === card.id);
            if(index !== -1){
                const [deletedCard] = column.cards.splice(index, 1);
                this.deletedCards.push({
                    ...deletedCard,
                    deletedFrom: columnIndex
                });
                this.saveData();
            }

        },


        restoreCard(card, targetIndex) {
    if (targetIndex === null) return;
    const targetColumn = this.columns[targetIndex]; 
    if (!targetColumn || targetColumn.title === 'Выполненные задачи') return;

    const index = this.deletedCards.findIndex(c => c.id === card.id);
    if (index !== -1) {
        const [restoredCard] = this.deletedCards.splice(index, 1);
        targetColumn.cards.push(restoredCard);
        targetColumn.cards.sort((a, b) => a.priority - b.priority);
        this.saveData();
    }
}



        handleCardReturn(card, reason){
            const fromColumn = 2;
            const toColumn = fromColumn - 1;

            const updatedCard = {
                ...card,
                returnReason: reason,
            };

            this.columns[fromColumn].cards = this.columns[fromColumn].cards.filter(c => c.id !== card.id);
            this.columns[toColumn].cards.push(updatedCard);
            this.saveData();
        },

        openModal(){
            this.editingCard = null;
            this.showModal = true;
            this.$nextTick(() => {
                this.$refs.cardForm.resetForm();
            });
        },

        closeModal(){
            this.showModal = false;
            this.editingCard = null;
            this.editingCardColumn = null;
        },
        addCard(newCard){
            this.columns[0].cards.push(newCard);
            this.closeModal();
            this.saveData();
        },
        cardMove(fromColumn, card){
            if(fromColumn === 2){
                const toColumn = fromColumn - 1;
                this.columns[fromColumn].cards = this.columns[fromColumn].cards.filter(a => a.id !== card.id);
                this.columns[toColumn].cards.push(card);
                this.saveData();
            }
        },

        moveCard(fromColumn, card){
            if(fromColumn >= 3) return;
            const toColumn = fromColumn + 1;

            this.columns[fromColumn].cards = this.columns[fromColumn].cards.filter(a => a.id !== card.id);
            this.columns[toColumn].cards.push(card);
            if(toColumn === 3){
                const deadline = new Date(card.deadline);
                const now = new Date();
                card.completedAt = now.toLocaleString();
                if(now > deadline){
                    card.overdue = true;
                }else{
                    card.ovetdue = false;
                }
            };

            this.saveData();
        },

        editCard(card, columnIndex){
            this.editingCard =  { ...card };
            this.editingCardColumn = columnIndex;
            this.showModal= true;
            this.$nextTick(() => {
                this.$refs.cardForm.resetForm();
            });
        },

        saveCard(updatedCard){
            const column = this.columns[this.editingCardColumn];
            const index = column.cards.findIndex(c => c.id === updatedCard.id);
            if(index !== -1){
              
                this.$set(column.cards, index,  {
                    ...column.cards[index],
                    ...updatedCard, 
                    updateAt: new Date().toLocaleString() 
                }    );
                this.closeModal();
                this.saveData();
            }
        },

        saveData(){
            const dataToSave = {
                columns: this.columns.map(column => ({
                    title: column.title,
                    cards: Array.isArray(column.cards) ? column.cards : []
                })),
                deletedCards: this.deletedCards
            };
            localStorage.setItem('notesApp', JSON.stringify(dataToSave));
        },
        loadData(){
            const savedData = localStorage.getItem('notesApp');
            if(savedData){
                const parsedData = JSON.parse(savedData);
                this.columns.forEach(column => {
                    const savedColumn = parsedData.columns?.find(c => c.title === column.title);
                    this.$set(column, 'cards', savedColumn?.cards || []);
                });
                this.deletedCards = parsedData.deletedCards || [];
            };
            this.saveData();
        },

    },

    created() {
        this.loadData();
    },

});