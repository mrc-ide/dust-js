class FilterState {
    readonly private _nParticles: number;
    readonly private _model: Dust;
    
    constructor(pars: UserType, Model: DustModelConstructable, data: FilterData,
                compare: FilterCompare, saveHistory: boolean,
                random: RngState) {
        // There's not a great way through here with using the Model
        // and model objects at the same time.
        this._model = new Model(base, pars, "ignore");
        this._model.setStep(data.initialTime);
        // TODO: support control over initial condition too
        this._nParticles = this.model.nParticles();

    }
    
}
